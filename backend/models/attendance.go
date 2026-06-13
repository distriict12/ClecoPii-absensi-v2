package models

import "time"

type Attendance struct {
	ID         uint     `gorm:"primaryKey" json:"id"`
	EmployeeID uint     `gorm:"not null" json:"employee_id"`
	Employee   Employee `gorm:"foreignKey:EmployeeID" json:"employee"` // Relasi ke tabel Karyawan
	
	Date       string   `gorm:"type:varchar(15);not null" json:"date"`       // Format: "2023-10-24"
	EntryTime  string   `gorm:"type:varchar(10)" json:"entry_time"`          // Format: "08:00"
	ExitTime   string   `gorm:"type:varchar(10)" json:"exit_time"`           // Format: "17:05"
	Status     string   `gorm:"type:varchar(20);not null" json:"status"`     // tepat, telat, absen
	
	EntryPhoto string   `gorm:"type:text" json:"entry_photo"` 
	ExitPhoto  string   `gorm:"type:text" json:"exit_photo"`
	
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}