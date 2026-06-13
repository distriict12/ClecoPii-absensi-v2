package main

import (
	"clecopii-absensi-v2/config"
	"clecopii-absensi-v2/database"
	"clecopii-absensi-v2/routes"
	"time"
)

func main() {

	loc, err := time.LoadLocation("Asia/Jakarta")
	if err == nil {
		time.Local = loc
	}

	// Load config .env
	config.LoadEnv()

	// Inisialisasi database
	database.InitDB()

	// Setup router
	r := routes.SetupRouter()

	// Start server
	r.Run(":" + config.GetEnv("APP_PORT", "3000"))
}