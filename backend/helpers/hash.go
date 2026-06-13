package helpers

import (
	"crypto/sha256"
	"encoding/hex"
)

func HashPin(pin string) (string, error) {
	hash := sha256.Sum256([]byte(pin))
	return hex.EncodeToString(hash[:]), nil
}

func CheckPin(pin, hashedPin string) bool {
	hash := sha256.Sum256([]byte(pin))
	return hex.EncodeToString(hash[:]) == hashedPin
}