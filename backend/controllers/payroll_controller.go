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
	// [FITUR BARU] VALIDASI MAKSIMAL 31 HARI & TANGGAL MUNDUR
	// ============================================================
	layout := "2006-01-02"
	start, errStart := time.Parse(layout, startDate)
	end, errEnd := time.Parse(layout, endDate)

	if errStart == nil && errEnd == nil {
		diffDays := end.Sub(start).Hours() / 24

		// Cegah tanggal akhir lebih dulu dari tanggal mulai (Tanggal Mundur)
		if diffDays < 0 {
			c.JSON(http.StatusBadRequest, structs.ErrorResponse{
				Success: false,
				Message: "Tanggal akhir tidak boleh mendahului tanggal mulai!",
			})
			return
		}

		// Cegah penarikan data lebih dari 31 hari
		if diffDays > 31 {
			c.JSON(http.StatusBadRequest, structs.ErrorResponse{
				Success: false,
				Message: "Batas maksimal filter payroll adalah 31 hari (1 Siklus)!",
			})
			return
		}
	}

	// 1. Ambil semua data karyawan beserta nama outletnya
	var employees []models.Employee
	if err := database.DB.Preload("Outlet").Find(&employees).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse{
			Success: false,
			Message: "Gagal mengambil data karyawan",
		})
		return
	}

	var payrolls []structs.PayrollResponse

	// 2. Lakukan kalkulasi untuk setiap karyawan
	for _, emp := range employees {
		var totalHadir int64
		var totalTelat int64
		var totalTepat int64

		// A. Hitung Total Hadir (status bukan 'absen' atau null)
		database.DB.Model(&models.Attendance{}).
			Where("employee_id = ? AND date >= ? AND date <= ? AND status != ?", emp.ID, startDate, endDate, "absen").
			Count(&totalHadir)

		// B. Hitung Berapa kali Telat
		database.DB.Model(&models.Attendance{}).
			Where("employee_id = ? AND date >= ? AND date <= ? AND status = ?", emp.ID, startDate, endDate, "telat").
			Count(&totalTelat)

		// C. Hitung Berapa kali Masuk TEPAT WAKTU
		database.DB.Model(&models.Attendance{}).
			Where("employee_id = ? AND date >= ? AND date <= ? AND status = ?", emp.ID, startDate, endDate, "tepat").
			Count(&totalTepat)

		// D. Hitung Bolos (Target Hari Kerja - Total Hadir)
		bolos := emp.TargetHariKerja - int(totalHadir)
		if bolos < 0 {
			bolos = 0
		}

		// ─── KALKULASI MATEMATIKA ───

		// 1. Hitung total bonus rajin: nominal bonus x frekuensi tepat waktu
		bonusRajinTotal := float64(totalTepat) * emp.BonusRajin

		// 2. Hitung total potongan denda
		potonganAbsenTotal := float64(bolos) * emp.PotonganAbsen
		potonganTelatTotal := float64(totalTelat) * emp.PotonganTelat

		// 3. Gaji Bersih Akhir
		gajiBersih := emp.GajiPokok + bonusRajinTotal - potonganAbsenTotal - potonganTelatTotal

		// Antisipasi jika nama outlet belum ter-set
		outletName := "-"
		if emp.Outlet.Name != "" {
			outletName = emp.Outlet.Name
		}

		// Masukkan ke dalam daftar response
		payrolls = append(payrolls, structs.PayrollResponse{
			ID:              emp.ID,
			EmployeeName:    emp.Name,
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
