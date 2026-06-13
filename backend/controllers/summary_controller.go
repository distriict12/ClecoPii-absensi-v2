package controllers

import (
	"clecopii-absensi-v2/database"
	"clecopii-absensi-v2/models"
	"clecopii-absensi-v2/structs"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func GetSummary(c *gin.Context) {
	outletName := c.Query("outlet")
	today := time.Now().Format("2006-01-02")

	// 1. Hitung total karyawan AKTIF
	// [FIX] Tambah filter is_active = true agar karyawan nonaktif tidak ikut dihitung
	queryEmp := database.DB.Model(&models.Employee{}).Where("is_active = ?", true)
	if outletName != "" && outletName != "Semua Outlet" {
		queryEmp = queryEmp.Joins("JOIN outlets ON outlets.id = employees.outlet_id").
			Where("outlets.name = ?", outletName)
	}
	var totalKaryawan int64
	queryEmp.Count(&totalKaryawan)

	// 2. Hitung Absensi Hari Ini
	var hadir, telat int64
	queryAtt := database.DB.Model(&models.Attendance{}).Where("date = ?", today)
	if outletName != "" && outletName != "Semua Outlet" {
		queryAtt = queryAtt.
			Joins("JOIN employees ON employees.id = attendances.employee_id").
			Joins("JOIN outlets ON outlets.id = employees.outlet_id").
			Where("outlets.name = ?", outletName)
	}
	queryAtt.Session(&gorm.Session{}).Where("status = ?", "tepat").Count(&hadir)
	queryAtt.Session(&gorm.Session{}).Where("status = ?", "telat").Count(&telat)

	belumAbsen := int(totalKaryawan) - int(hadir+telat)
	if belumAbsen < 0 {
		belumAbsen = 0
	}

	// 3. Rakit Data Bar Chart per Outlet
	var outlets []models.Outlet
	database.DB.Find(&outlets)

	var barData []structs.BarChartData
	for _, o := range outlets {
		// Skip outlet yang tidak sesuai filter
		if outletName != "" && outletName != "Semua Outlet" && o.Name != outletName {
			continue
		}

		// [FIX] Hitung hanya karyawan AKTIF per outlet
		var empTotal int64
		database.DB.Model(&models.Employee{}).
			Where("outlet_id = ? AND is_active = ?", o.ID, true).
			Count(&empTotal)

		// Hitung yang hadir hari ini (tepat + telat)
		var empHadir int64
		database.DB.Model(&models.Attendance{}).
			Joins("JOIN employees ON employees.id = attendances.employee_id").
			Where("employees.outlet_id = ? AND date = ? AND status != ?", o.ID, today, "absen").
			Count(&empHadir)

		barData = append(barData, structs.BarChartData{
			Name:  o.Name,
			Total: int(empTotal),
			Hadir: int(empHadir),
		})
	}

	// 4. Rakit response final
	summary := structs.SummaryResponse{
		KPI: structs.SummaryKPI{
			Hadir:         int(hadir),
			BelumAbsen:    belumAbsen,
			Telat:         int(telat),
			TotalKaryawan: int(totalKaryawan),
		},
		PieData: []structs.PieChartData{
			{Name: "Hadir Tepat", Value: int(hadir),  Color: "#ffe600"},
			{Name: "Hadir Telat", Value: int(telat),  Color: "#bb0058"},
			{Name: "Belum Absen", Value: belumAbsen,  Color: "#e2e2e2"},
		},
		BarData: barData,
	}

	c.JSON(http.StatusOK, structs.SuccessResponse{
		Success: true,
		Data:    summary,
	})
}