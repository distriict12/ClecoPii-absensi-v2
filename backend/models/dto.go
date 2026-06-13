package models

type OutletPresence struct {
	Name  string `json:"name"`
	Hadir int    `json:"hadir"`
	Total int    `json:"total"`
}

type DashboardKPI struct {
	TotalKaryawan int `json:"total_karyawan"`
	HadirTepat    int `json:"hadir_tepat"`
	HadirTelat    int `json:"hadir_telat"`
	BelumAbsen    int `json:"belum_absen"`
}

type DashboardResponse struct {
	KPI          DashboardKPI     `json:"kpi"`
	OutletCharts []OutletPresence `json:"outlet_charts"`
}
