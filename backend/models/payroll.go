package models

import "time"

type Payroll struct {
	ID uint `json:"id" gorm:"primaryKey"`
	EmployeeID uint      `json:"employee_id" gorm:"not null"`
	Employee   *Employee `json:"employee,omitempty" gorm:"foreignKey:EmployeeID"`

	StartDate string `json:"start_date" gorm:"type:date;not null"`
	EndDate   string `json:"end_date" gorm:"type:date;not null"`

	TargetHariKerja int `json:"target_hari_kerja" gorm:"not null"`
	HadirHari       int `json:"hadir_hari" gorm:"default:0"`
	FrekuensiTelat  int `json:"frekuensi_telat" gorm:"default:0"`
	GajiPokok     float64 `json:"gaji_pokok" gorm:"default:0"`
	Bonus         float64 `json:"bonus" gorm:"default:0"`
	PotonganAbsen float64 `json:"pot_absen" gorm:"default:0"`
	PotonganTelat float64 `json:"pot_telat" gorm:"default:0"`
	GajiBersih float64 `json:"gaji_bersih" gorm:"not null"`
	Status string `json:"status" gorm:"type:varchar(20);default:'paid'"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
