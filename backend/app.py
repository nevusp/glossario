from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import unicodedata
from pathlib import Path

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_PATH = Path("data/glossario.csv")

def normalize(text):
    return unicodedata.normalize("NFKD", text).encode("ASCII", "ignore").decode("utf-8").lower()

def load_data():
    df = pd.read_csv(DATA_PATH)
    df = df.fillna("")
    return df

def save_data(df):
    df.to_csv(DATA_PATH, index=False)

@app.get("/")
def root():
    return {"message": "Glossário API online"}

@app.get("/terms")
def get_terms(limit: int = 10, offset: int = 0):
    df = load_data()
    df = df.sort_values(by="WORD", key=lambda col: col.map(normalize))
    total = len(df)
    result = df.iloc[offset:offset+limit]

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "data": result.to_dict(orient="records")
    }

@app.get("/terms/{word}")
def get_term(word: str):
    df = load_data()
    result = df[df["WORD"].str.lower() == word.lower()]
    return result.to_dict(orient="records")


@app.post("/terms")
def add_term(term: dict):

    df = load_data()

    word = term.get("WORD")

    if not word:
        raise HTTPException(status_code=400, detail="Campo WORD é obrigatório")

    # verifica duplicidade
    if word.lower() in df["WORD"].str.lower().values:
        raise HTTPException(status_code=400, detail="Termo já existe no glossário")

    df = pd.concat([df, pd.DataFrame([term])], ignore_index=True)

    save_data(df)

    return {"message": "Term added"}


@app.put("/terms/{word}")
def update_term(word: str, updated_term: dict):

    df = load_data()

    mask = df["WORD"].str.lower() == word.lower()

    if not mask.any():
        raise HTTPException(status_code=404, detail="Termo não encontrado")

    new_word = updated_term.get("WORD")

    if not new_word:
        raise HTTPException(status_code=400, detail="Campo WORD é obrigatório")

    # verifica duplicidade (exceto o próprio registro)
    duplicate_mask = (
        (df["WORD"].str.lower() == new_word.lower()) &
        (~mask)
    )

    if duplicate_mask.any():
        raise HTTPException(status_code=400, detail="Já existe outro termo com esse WORD")

    # atualiza linha
    index = df[mask].index[0]

    for key, value in updated_term.items():
        if key in df.columns:
            df.at[index, key] = value

    save_data(df)

    return {"message": "Term updated"}


@app.delete("/terms/{word}")
def delete_term(word: str):

    df = load_data()

    new_df = df[df["WORD"].str.lower() != word.lower()]

    if len(new_df) == len(df):
        raise HTTPException(status_code=404, detail="Termo não encontrado")

    save_data(new_df)

    return {"message": "Deleted"}