package structs

type SummaryResponse struct {
	KPI      SummaryKPI       `json:"kpi"`
	PieData  []PieChartData   `json:"pie_data"`
	BarData  []BarChartData   `json:"bar_data"`
}

type SummaryKPI struct {
	Hadir         int `json:"hadir"`
	BelumAbsen    int `json:"belum_absen"`
	Telat         int `json:"telat"`
	TotalKaryawan int `json:"total_karyawan"`
}

type PieChartData struct {
	Name  string `json:"name"`
	Value int    `json:"value"`
	Color string `json:"color"`
}

type BarChartData struct {
	Name  string `json:"name"`
	Hadir int    `json:"hadir"`
	Total int    `json:"total"`
}