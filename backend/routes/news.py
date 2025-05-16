from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from ..database import get_db
from ..models import News, User
from ..auth import get_current_user, get_admin_user

router = APIRouter(
    prefix="/news",
    tags=["news"],
)

class NewsBase(BaseModel):
    title: str  
    content: str  
    url: str  
    image_url: Optional[str] = None 

class NewsCreate(NewsBase):
    pass 


class NewsUpdate(BaseModel):
    title: Optional[str] = None  
    content: Optional[str] = None
    url: Optional[str] = None
    image_url: Optional[str] = None

class NewsResponse(NewsBase):
    id: int
    created_at: datetime
    updated_at: datetime
    created_by: int

    class Config:
        from_attributes = True 

@router.get("/", response_model=List[NewsResponse])
def get_all_news(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    
    noticias = db.query(News).offset(skip).limit(limit).all()
    return noticias

@router.get("/{news_id}", response_model=NewsResponse)
def get_news(news_id: int, db: Session = Depends(get_db)):
    
    noticia = db.query(News).filter(News.id == news_id).first()
    
   
    if noticia is None:
        print(f"No se encontró noticia con ID: {news_id}")
        raise HTTPException(status_code=404, detail="No encontramos esa noticia")
    
    return noticia

@router.post("/", response_model=NewsResponse, status_code=status.HTTP_201_CREATED)
def create_news(
    news: NewsCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    print(f"Creando noticia: {news.title}")
    
    # Crear objeto de noticia
    nueva_noticia = News(
        title=news.title,
        content=news.content,
        url=news.url,
        image_url=news.image_url,
        created_by=current_user.id  
    )
    
    # Guardar en la base de datos
    db.add(nueva_noticia)
    db.commit()
    db.refresh(nueva_noticia)
    
    print(f"Noticia creada con ID: {nueva_noticia.id}")
    return nueva_noticia

@router.put("/{news_id}", response_model=NewsResponse)
def update_news(
    news_id: int,
    news_update: NewsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    # Buscar la noticia que queremos actualizar
    noticia = db.query(News).filter(News.id == news_id).first()
    
    # Comprobar que existe
    if noticia is None:
        print(f"No se encontró la noticia con ID {news_id}")
        raise HTTPException(status_code=404, detail="No encontramos esa noticia")
    
    # Actualizar los campos
    try:
        
        if hasattr(news_update, "model_dump"):
            datos = news_update.model_dump(exclude_unset=True)
        else:
            datos = news_update.dict(exclude_unset=True)
        
       
        for campo, valor in datos.items():
            
            if valor is not None:
                setattr(noticia, campo, valor)
        
        
        noticia.updated_at = datetime.utcnow()
        
        
        db.commit()
        db.refresh(noticia)
        
        print(f"Noticia {news_id} actualizada correctamente")
        return noticia
        
    except Exception as e:
        
        db.rollback()
        print(f"Error al actualizar la noticia: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al actualizar la noticia: {str(e)}"
        )

@router.delete("/{news_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_news(
    news_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    noticia = db.query(News).filter(News.id == news_id).first()
    
    if noticia is None:
        print(f"No se pudo borrar: La noticia con ID {news_id} no existe")
        raise HTTPException(status_code=404, detail="No encontramos esa noticia")
    
    print(f"Eliminando noticia: {noticia.title} (ID: {news_id})")
    db.delete(noticia)
    db.commit()
    
    print(f"Noticia eliminada correctamente")
    return None