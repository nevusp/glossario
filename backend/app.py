from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
import os
import pandas as pd
from dotenv import load_dotenv

# carregar .env
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
# print(DATABASE_URL)

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ajuste depois em produção
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# conexão
def get_connection():
    return psycopg2.connect(DATABASE_URL)

# helper
def rows_to_dict(cursor, rows):
    columns = [desc[0].upper() for desc in cursor.description]
    return [dict(zip(columns, row)) for row in rows]

# criar tabela
def create_table():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS terms (
        WORD TEXT PRIMARY KEY,
        AREA_PRIMARY TEXT,
        SUBAREA_PRIMARY TEXT,
        CONCEPT_TYPE TEXT,
        DESCRIPTION_GENERAL TEXT,
        DESCRIPTION_SOCIAL_SCIENCES TEXT,
        DESCRIPTION_DATA_SCIENCE TEXT,
        CROSS_AREA_RELATION TEXT,
        DATA_OPERATIONALIZATION TEXT,
        EXAMPLES TEXT,
        RELATED_TERMS TEXT,
        REFERENCES_SOURCE TEXT
    )
    """)

    conn.commit()
    conn.close()

create_table()

# root
@app.get("/")
def root():
    return {"message": "Glossário API (PostgreSQL) online"}

# listar termos (paginação + busca)
@app.get("/terms")
def get_terms(limit: int = 10, offset: int = 0, search: str = ""):

    conn = get_connection()
    cursor = conn.cursor()

    base_query = "FROM terms"
    params = []

    if search:
        base_query += " WHERE LOWER(WORD) LIKE %s"
        params.append(f"%{search.lower()}%")

    # total
    cursor.execute(f"SELECT COUNT(*) {base_query}", params)
    total = cursor.fetchone()[0]

    # dados
    query = f"""
    SELECT * {base_query}
    ORDER BY LOWER(WORD)
    LIMIT %s OFFSET %s
    """
    params_data = params + [limit, offset]

    cursor.execute(query, params_data)
    rows = cursor.fetchall()

    data = rows_to_dict(cursor, rows)

    conn.close()

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "data": data
    }

# buscar termo específico
@app.get("/terms/{word}")
def get_term(word: str):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM terms WHERE LOWER(WORD) = %s",
        (word.lower(),)
    )

    row = cursor.fetchone()

    conn.close()

    return [dict(zip([desc[0].upper() for desc in cursor.description], row))] if row else []


# adicionar termo
@app.post("/terms")
def add_term(term: dict):

    if not term["WORD"]:
        raise HTTPException(status_code=400, detail="Campo WORD é obrigatório")

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT 1 FROM terms WHERE LOWER(WORD) = %s",
        (term["WORD"].lower(),)
    )

    if cursor.fetchone():
        conn.close()
        return {"message": "Palavra já existe"}

    cursor.execute("""
    INSERT INTO terms VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """, tuple(term.values()))

    conn.commit()
    conn.close()

    return {"message": "Term added"}

# atualizar termo
@app.put("/terms/{word}")
def update_term(word: str, term: dict):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT 1 FROM terms WHERE LOWER(WORD) = %s",
        (term["WORD"].lower(),)
    )

    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Termo não encontrado")

    cursor.execute("""
    UPDATE terms SET
        WORD=%s,
        AREA_PRIMARY=%s,
        SUBAREA_PRIMARY=%s,
        CONCEPT_TYPE=%s,
        DESCRIPTION_GENERAL=%s,
        DESCRIPTION_SOCIAL_SCIENCES=%s,
        DESCRIPTION_DATA_SCIENCE=%s,
        CROSS_AREA_RELATION=%s,
        DATA_OPERATIONALIZATION=%s,
        EXAMPLES=%s,
        RELATED_TERMS=%s,
        REFERENCES_SOURCE=%s
    WHERE LOWER(WORD)=%s
    """, (*term.values(), word.lower()))

    conn.commit()
    conn.close()

    return {"message": "Updated"}

# deletar termo
@app.delete("/terms/{word}")
def delete_term(word: str):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT 1 FROM terms WHERE LOWER(WORD) = %s",
        (word.lower(),)
    )

    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Termo não encontrado")

    cursor.execute(
        "DELETE FROM terms WHERE LOWER(WORD) = %s",
        (word.lower(),)
    )

    conn.commit()
    conn.close()

    return {"message": "Deleted"}

# importar CSV (merge inteligente)
@app.post("/import-csv")
async def import_csv(file: UploadFile = File(...)):

    df = pd.read_csv(file.file)

    conn = get_connection()
    cursor = conn.cursor()

    inserted = 0
    updated = 0

    for _, row in df.iterrows():

        cursor.execute(
            "SELECT 1 FROM terms WHERE LOWER(WORD) = %s",
            (row["WORD"].lower(),)
        )

        if cursor.fetchone():
            # update
            cursor.execute("""
            UPDATE terms SET
                AREA_PRIMARY=%s,
                SUBAREA_PRIMARY=%s,
                CONCEPT_TYPE=%s,
                DESCRIPTION_GENERAL=%s,
                DESCRIPTION_SOCIAL_SCIENCES=%s,
                DESCRIPTION_DATA_SCIENCE=%s,
                CROSS_AREA_RELATION=%s,
                DATA_OPERATIONALIZATION=%s,
                EXAMPLES=%s,
                RELATED_TERMS=%s,
                REFERENCES_SOURCE=%s
            WHERE LOWER(WORD)=%s
            """, (
                row["AREA_PRIMARY"],
                row["SUBAREA_PRIMARY"],
                row["CONCEPT_TYPE"],
                row["DESCRIPTION_GENERAL"],
                row["DESCRIPTION_SOCIAL_SCIENCES"],
                row["DESCRIPTION_DATA_SCIENCE"],
                row["CROSS_AREA_RELATION"],
                row["DATA_OPERATIONALIZATION"],
                row["EXAMPLES"],
                row["RELATED_TERMS"],
                row["REFERENCES_SOURCE"],
                row["WORD"].lower()
            ))

            updated += 1

        else:
            # insert
            cursor.execute("""
            INSERT INTO terms VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """, tuple(row))

            inserted += 1

    conn.commit()
    conn.close()

    return {
        "message": "Importação concluída",
        "inserted": inserted,
        "updated": updated
    }