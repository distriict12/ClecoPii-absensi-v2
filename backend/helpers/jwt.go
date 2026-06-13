package helpers

import (
	"clecopii-absensi-v2/config"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// var jwtKey = []byte(config.GetEnv("JWT_SECRET", "secret_key"))

func GenerateToken(userID uint, role string) (string, error) {

	jwtKey := []byte(config.GetEnv("JWT_SECRET", "secret_key"))

	expirationTime := time.Now().Add(60 * time.Minute)

	claims := jwt.MapClaims{
		"user_id": userID,
		"role":    role,
		"exp":     jwt.NewNumericDate(expirationTime),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtKey)

	return tokenString, err
}