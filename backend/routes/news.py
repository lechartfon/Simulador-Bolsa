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

class NewsUpdate(NewsBase):
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
    news = db.query(News).offset(skip).limit(limit).all()
    return news

@router.get("/{news_id}", response_model=NewsResponse)
def get_news(news_id: int, db: Session = Depends(get_db)):
    news = db.query(News).filter(News.id == news_id).first()
    if news is None:
        raise HTTPException(status_code=404, detail="News not found")
    return news

@router.post("/", response_model=NewsResponse, status_code=status.HTTP_201_CREATED)
def create_news(
    news: NewsCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    db_news = News(
        title=news.title,
        content=news.content,
        url=news.url,
        image_url=news.image_url,
        created_by=current_user.id
    )
    db.add(db_news)
    db.commit()
    db.refresh(db_news)
    return db_news

@router.put("/{news_id}", response_model=NewsResponse)
def update_news(
    news_id: int,
    news_update: NewsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    db_news = db.query(News).filter(News.id == news_id).first()
    if db_news is None:
        raise HTTPException(status_code=404, detail="News not found")
    
    try:
        if hasattr(news_update, "model_dump"):
            update_data = news_update.model_dump(exclude_unset=True)
        else:
            update_data = news_update.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(db_news, field, value)
        
        db_news.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(db_news)
        return db_news
    except Exception as e:
        db.rollback()
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
    db_news = db.query(News).filter(News.id == news_id).first()
    if db_news is None:
        raise HTTPException(status_code=404, detail="News not found")
    
    db.delete(db_news)
    db.commit()
    return None 