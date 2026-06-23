package controllers

import (
	"clecopii-absensi-v2/database"
	"clecopii-absensi-v2/models"
	"clecopii-absensi-v2/structs"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// GetPayroll menghitung gaji semua karyawan berdasarkan rentang tanggal dengan bonus akumulatif tepat waktu
func GetPayroll(c *gin.Context) {
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	if startDate == "" || endDate == "" {
		c.JSON(http.StatusBadRequest, structs.ErrorResponse{
			Success: false,
			Message: "Parameter start_date dan end_date wajib diisi",
		})
		return
	}

	// ============================================================
	// VALIDASI MAKSIMAL 31 HARI & TANGGAL MUNDUR
	// ============================================================
	layout := "2006-01-02"
	start, errStart := time.Parse(layout, startDate)
	end, errEnd := time.Parse(layout, endDate)
	if errStart == nil && errEnd == nil {
		diffDays := end.Sub(start).Hours() / 24
		if diffDays < 0 {
			c.JSON(http.StatusBadRequest, structs.ErrorResponse{
				Success: false,
				Message: "Tanggal akhir tidak boleh mendahului tanggal mulai!",
			})
			return
		}
		if diffDays > 31 {
			c.JSON(http.StatusBadRequest, structs.ErrorResponse{
				Success: false,
				Message: "Batas maksimal filter payroll adalah 31 hari (1 Siklus)!",
			})
			return
		}
	}

	// ============================================================
	// [SOFT DELETE] Ambil karyawan AKTIF saja sebagai basis utama
	// ============================================================
	var employees []models.Employee
	if err := database.DB.Preload("Outlet").Where("is_active = ?", true).Find(&employees).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse{
			Success: false,
			Message: "Gagal mengambil data karyawan",
		})
		return
	}

	// ============================================================
	// [SOFT DELETE] Karyawan NONAKTIF tapi punya riwayat hadir
	// di periode ini tetap disertakan — supaya gaji periode
	// terakhir sebelum resign tidak hilang dari payroll.
	// ============================================================
	var inactiveEmployees []models.Employee
	database.DB.Preload("Outlet").
		Where("is_active = ?", false).
		Where("EXISTS (SELECT 1 FROM attendances WHERE attendances.employee_id = employees.id AND attendances.date >= ? AND attendances.date <= ?)", startDate, endDate).
		Find(&inactiveEmployees)

	allEmployees := append(employees, inactiveEmployees...)

	var payrolls []structs.PayrollResponse

	for _, emp := range allEmployees {
		var totalHadir int64
		var totalTelat int64
		var totalTepat int64

		database.DB.Model(&models.Attendance{}).
			Where("employee_id = ? AND date >= ? AND date <= ? AND status != ?", emp.ID, startDate, endDate, "absen").
			Count(&totalHadir)

		database.DB.Model(&models.Attendance{}).
			Where("employee_id = ? AND date >= ? AND date <= ? AND status = ?", emp.ID, startDate, endDate, "telat").
			Count(&totalTelat)

		database.DB.Model(&models.Attendance{}).
			Where("employee_id = ? AND date >= ? AND date <= ? AND status = ?", emp.ID, startDate, endDate, "tepat").
			Count(&totalTepat)

		bolos := emp.TargetHariKerja - int(totalHadir)
		if bolos < 0 {
			bolos = 0
		}

		bonusRajinTotal := float64(totalTepat) * emp.BonusRajin
		potonganAbsenTotal := float64(bolos) * emp.PotonganAbsen
		potonganTelatTotal := float64(totalTelat) * emp.PotonganTelat

		gajiBersih := emp.GajiPokok + bonusRajinTotal - potonganAbsenTotal - potonganTelatTotal

		outletName := "-"
		if emp.Outlet.Name != "" {
			outletName = emp.Outlet.Name
		}

		// [SOFT DELETE] Tandai nama karyawan nonaktif agar terlihat jelas di tabel payroll
		displayName := emp.Name
		if !emp.IsActive {
			displayName = emp.Name + " (Nonaktif)"
		}

		payrolls = append(payrolls, structs.PayrollResponse{
			ID:              emp.ID,
			EmployeeName:    displayName,
			OutletName:      outletName,
			SalaryType:      emp.SalaryType,
			TargetHariKerja: emp.TargetHariKerja,
			HadirHari:       int(totalHadir),
			FrekuensiTelat:  int(totalTelat),
			GajiPokok:       emp.GajiPokok,
			BonusRajin:      bonusRajinTotal,
			PotonganAbsen:   emp.PotonganAbsen,
			PotonganTelat:   emp.PotonganTelat,
			GajiBersih:      gajiBersih,
		})
	}

	if payrolls == nil {
		payrolls = []structs.PayrollResponse{}
	}

	c.JSON(http.StatusOK, structs.SuccessResponse{
		Success: true,
		Message: "Data Payroll Berhasil Dihitung",
		Data:    payrolls,
	})
}