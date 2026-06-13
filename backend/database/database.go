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

	defaultDSN := "host=aws-1-ap-southeast-1.pooler.supabase.com user=postgres.eiidozttwfikrvysekox password=t1QrbFnpi94gDxU9 dbname=postgres port=6543 sslmode=require"

	dsn := config.GetEnv("DB_URL", defaultDSN)

	// Koneksi ke database PostgreSQL
	var err error
	
	DB, err = gorm.Open(postgres.New(postgres.Config{
		DSN:                  dsn,
		PreferSimpleProtocol: true, // Mematikan prepared statement untuk kompatibilitas PgBouncer Supabase
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