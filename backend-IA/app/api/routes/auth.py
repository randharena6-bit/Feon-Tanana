from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    get_user_by_email,
    get_user_by_username,
    hash_password,
    verify_password,
)
from app.database import get_db
from app.api.deps import get_current_user
from app.models_db.user import User
from app.schemas.auth import Token, UserCreate, UserLogin, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate, db: Session = Depends(get_db)) -> Token:
    if get_user_by_username(db, payload.username):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ce nom d'utilisateur est déjà pris",
        )
    if get_user_by_email(db, payload.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cet email est déjà utilisé",
        )
    user = User(
        username=payload.username,
        email=payload.email,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return Token(access_token=create_access_token(user), user=UserOut.model_validate(user))


@router.post("/login", response_model=Token)
async def login(payload: UserLogin, db: Session = Depends(get_db)) -> Token:
    user = get_user_by_username(db, payload.username)
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nom d'utilisateur ou mot de passe incorrect",
        )
    return Token(access_token=create_access_token(user), user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)) -> UserOut:
    return UserOut.model_validate(current_user)
