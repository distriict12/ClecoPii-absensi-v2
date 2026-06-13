package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

func LoadEnv() {
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: No .env file found, using system environment variables")
	}
}

func GetEnv(key string, defaultvalue string) string{
	value, exist := os.LookupEnv(key)
	if !exist {
		return  defaultvalue
	}
	
	return value
}
