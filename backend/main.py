from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

app = FastAPI()

origins = [
    "http://localhost:5173",  
    "http://127.0.0.1:5173", 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)

@app.get("/")
async def read_root():
    return {"message": "Hello World"}

@app.post("/register")
async def register(user_data: dict):
    return {"message": "Usuario registrado", "data": user_data}

@app.post("/login")
async def login(user_data: dict):
    return {"message": "Usuario logeado correctamente", "data": user_data}