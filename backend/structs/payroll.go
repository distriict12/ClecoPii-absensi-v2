package structs

type PayrollResponse struct {
	ID              uint    `json:"id"`
	EmployeeName    string  `json:"employee_name"`
	OutletName      string  `json:"outlet_name"`
	SalaryType      string  `json:"salary_type"`
	TargetHariKerja int     `json:"target_hari_kerja"`
	HadirHari       int     `json:"hadir_hari"`
	FrekuensiTelat  int     `json:"frekuensi_telat"`
	GajiPokok       float64 `json:"gaji_pokok"`
	BonusRajin      float64 `json:"bonus_rajin"`
	PotonganAbsen   float64 `json:"potongan_absen"`
	PotonganTelat   float64 `json:"potongan_telat"`
	GajiBersih      float64 `json:"gaji_bersih"`
}