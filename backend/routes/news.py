import logging
from datetime import datetime
from typing import List, Optional
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from auth import get_admin_user, get_current_user
from database import get_db
from models import News, User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/news", tags=["news"])


def _validate_url(value: Optional[str], *, required: bool, max_length: int = 500) -> Optional[str]:
    if value is None:
        if required:
            raise HTTPException(status_code=400, detail="URL no válida")
        return None
    v = value.strip()
    if required and not v:
        raise HTTPException(status_code=400, detail="URL no válida")
    if not v:
        return None
    if len(v) > max_length:
        raise HTTPException(status_code=400, detail="URL demasiado larga")
    parsed = urlparse(v)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        raise HTTPException(status_code=400, detail="Solo se permiten URLs http(s)")
    return v


class NewsBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1, max_length=2000)
    url: str = Field(min_length=1, max_length=500)
    image_url: Optional[str] = Field(default=None, max_length=500)


class NewsCreate(NewsBase):
    pass


class NewsUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    content: Optional[str] = Field(default=None, min_length=1, max_length=2000)
    url: Optional[str] = Field(default=None, min_length=1, max_length=500)
    image_url: Optional[str] = Field(default=None, max_length=500)


class NewsResponse(NewsBase):
    id: int
    created_at: datetime
    updated_at: datetime
    created_by: int

    model_config = {"from_attributes": True}


@router.get("/", response_model=List[NewsResponse])
def get_all_news(
    skip: int = Query(0, ge=0, le=10000),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return db.query(News).order_by(News.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{news_id}", response_model=NewsResponse)
def get_news(news_id: int, db: Session = Depends(get_db)):
    noticia = db.query(News).filter(News.id == news_id).first()
    if noticia is None:
        raise HTTPException(status_code=404, detail="No encontramos esa noticia")
    return noticia


@router.post("/", response_model=NewsResponse, status_code=status.HTTP_201_CREATED)
def create_news(news: NewsCreate, db: Session = Depends(get_db), current_user: User = Depends(get_admin_user)):
    nueva = News(
        title=news.title.strip(),
        content=news.content.strip(),
        url=_validate_url(news.url, required=True),
        image_url=_validate_url(news.image_url, required=False),
        created_by=current_user.id,
    )
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva


@router.put("/{news_id}", response_model=NewsResponse)
def update_news(news_id: int, news_update: NewsUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_admin_user)):
    noticia = db.query(News).filter(News.id == news_id).first()
    if noticia is None:
        raise HTTPException(status_code=404, detail="No encontramos esa noticia")

    datos = news_update.model_dump(exclude_unset=True)
    try:
        if "title" in datos and datos["title"] is not None:
            noticia.title = datos["title"].strip()
        if "content" in datos and datos["content"] is not None:
            noticia.content = datos["content"].strip()
        if "url" in datos:
            noticia.url = _validate_url(datos["url"], required=True)
        if "image_url" in datos:
            noticia.image_url = _validate_url(datos["image_url"], required=False)
        noticia.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(noticia)
    except HTTPException:
        raise
    except Exception:
        db.rollback()
        logger.exception("Error al actualizar noticia %s", news_id)
        raise HTTPException(status_code=500, detail="No se pudo actualizar la noticia")
    return noticia


@router.delete("/{news_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_news(news_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_admin_user)):
    noticia = db.query(News).filter(News.id == news_id).first()
    if noticia is None:
        raise HTTPException(status_code=404, detail="No encontramos esa noticia")
    db.delete(noticia)
    db.commit()
    return None
