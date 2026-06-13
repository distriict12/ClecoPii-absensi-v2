package models

import "time"

type Employee struct {
	ID              uint    `json:"id" gorm:"primaryKey"`
	UserID          uint    `json:"user_id" gorm:"unique;not null"`
	OutletID        uint    `json:"outlet_id" binding:"required"`
	Outlet          Outlet  `gorm:"foreignKey:OutletID" json:"outlet"`
	EmployeeCode    string  `json:"employee_code" gorm:"type:varchar(20);unique"`
	Name            string  `json:"name" gorm:"type:varchar(100);not null"`
	Position        string  `json:"position" gorm:"type:varchar(50)"`
	SalaryType      string  `json:"salary_type" gorm:"type:varchar(20);default:'Bulanan'"`
	GajiPokok       float64 `json:"gaji_pokok" gorm:"default:0"`
	PotonganTelat   float64 `json:"potongan_telat" gorm:"default:0"`
	PotonganAbsen   float64 `json:"potongan_absen" gorm:"default:0"`
	BonusRajin      float64 `json:"bonus_rajin" gorm:"default:0"`
	JamMasuk        string  `json:"jam_masuk" gorm:"type:time;not null"`
	JamKeluar       string  `json:"jam_keluar" gorm:"type:time;not null"`
	WorkingDays     string  `json:"working_days" gorm:"type:text"`
	TargetHariKerja int     `json:"target_hari_kerja" gorm:"default:22"`
	// [SOFT DELETE] Karyawan tidak dihapus, hanya dinonaktifkan
	IsActive  bool      `json:"is_active" gorm:"default:true"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
