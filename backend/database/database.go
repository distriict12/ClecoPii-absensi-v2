package database

import (
	"fmt"
	"log"

	"clecopii-absensi-v2/config"
	"clecopii-absensi-v2/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() {

	dsn := config.GetEnv("DB_URL", "")
	if dsn == "" {
		log.Fatal("DB_URL environment variable is not set")
	}

	var err error
	DB, err = gorm.Open(postgres.New(postgres.Config{
		DSN:                  dsn,
		PreferSimpleProtocol: true, // Kompatibilitas PgBouncer Supabase
	}), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	fmt.Println("Database connected successfully!")

	err = DB.AutoMigrate(
		&models.User{},
		&models.Outlet{},
		&models.Employee{},
		&models.Attendance{},
		&models.Payroll{},
	)
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	fmt.Println("Database migrated successfully!")
}