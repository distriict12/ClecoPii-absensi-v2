package structs

// 1. Struct untuk Payload Tambah Data
type EmployeeCreateRequest struct {
	Name            string  `json:"name" binding:"required"`
	Position        string  `json:"position" binding:"required"`
	EmployeeCode    string  `json:"employee_code" binding:"required"`
	Pin             string  `json:"pin" binding:"required,numeric,min=4,max=6"`
	OutletID        uint    `json:"outlet_id" binding:"required"`
	SalaryType      string  `json:"salary_type" binding:"required"`
	GajiPokok       float64 `json:"gaji_pokok" binding:"required"`
	PotonganTelat   float64 `json:"potongan_telat"`
	PotonganAbsen   float64 `json:"potongan_absen"`
	BonusRajin      float64 `json:"bonus_rajin"`
	JamMasuk        string  `json:"jam_masuk" binding:"required"`
	JamKeluar       string  `json:"jam_keluar" binding:"required"`
	WorkingDays     string  `json:"working_days" binding:"required"`
	TargetHariKerja int     `json:"target_hari_kerja" binding:"required"`
}

// 2. Struct untuk Format Balikan Data
type EmployeeResponse struct {
	ID              uint    `json:"id"`
	EmployeeCode    string  `json:"employee_code"`
	Name            string  `json:"name"`
	Position        string  `json:"position"`
	OutletID        uint    `json:"outlet_id"`
	OutletName      string  `json:"outlet_name"`
	GajiPokok       float64 `json:"gaji_pokok"`
	SalaryType      string  `json:"salary_type"`
	PotonganTelat   float64 `json:"potongan_telat"`
	PotonganAbsen   float64 `json:"potongan_absen"`
	BonusRajin      float64 `json:"bonus_rajin"`
	JamMasuk        string  `json:"jam_masuk"`
	JamKeluar       string  `json:"jam_keluar"`
	WorkingDays     string  `json:"working_days"`
	TargetHariKerja int     `json:"target_hari_kerja"`
	// [SOFT DELETE] Sertakan status aktif di response
	IsActive        bool    `json:"is_active"`
}

// 3. Struct untuk Payload Edit Data
type EmployeeUpdateRequest struct {
	Name            string  `json:"name" binding:"required"`
	Position        string  `json:"position" binding:"required"`
	EmployeeCode    string  `json:"employee_code" binding:"required"`
	Pin             string  `json:"pin"` // Opsional — kosong = tidak ganti PIN
	OutletID        uint    `json:"outlet_id" binding:"required"`
	SalaryType      string  `json:"salary_type" binding:"required"`
	GajiPokok       float64 `json:"gaji_pokok" binding:"required"`
	PotonganTelat   float64 `json:"potongan_telat" binding:"required"`
	PotonganAbsen   float64 `json:"potongan_absen" binding:"required"`
	BonusRajin      float64 `json:"bonus_rajin" binding:"required"`
	JamMasuk        string  `json:"jam_masuk" binding:"required"`
	JamKeluar       string  `json:"jam_keluar" binding:"required"`
	WorkingDays     string  `json:"working_days" binding:"required"`
	TargetHariKerja int     `json:"target_hari_kerja" binding:"required"`
}