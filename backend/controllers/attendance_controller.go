package controllers

import (
	"clecopii-absensi-v2/database"
	"clecopii-absensi-v2/helpers"
	"clecopii-absensi-v2/models"
	"clecopii-absensi-v2/structs"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

// toMinutes mengubah string "HH:MM" atau "HH:MM:SS" ke total menit
func toMinutes(t string) int {
	parts := strings.Split(t, ":")
	if len(parts) < 2 {
		return 0
	}
	h, _ := strconv.Atoi(parts[0])
	m, _ := strconv.Atoi(parts[1])
	return h*60 + m
}

// 1. CREATE: Karyawan absen masuk
func CreateAttendance(c *gin.Context) {
	var req structs.AttendanceRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ErrorResponse{
			Success: false,
			Message: "Validasi Gagal",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	// ── [VALIDASI BATAS WAKTU] ────────────────────────────────────────
	// Ambil data karyawan untuk cek jam_keluar-nya
	var employee models.Employee
	if err := database.DB.First(&employee, req.EmployeeID).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse{
			Success: false,
			Message: "Data karyawan tidak ditemukan",
			Errors:  map[string]string{"employee": "ID tidak valid"},
		})
		return
	}

	// Normalisasi jam keluar ke HH:MM
	jamKeluar := employee.JamKeluar
	if len(jamKeluar) > 5 {
		jamKeluar = jamKeluar[:5]
	}

	// Waktu absen dari request (sudah dalam format HH:MM)
	nowMin := toMinutes(req.EntryTime)
	keluarMin := toMinutes(jamKeluar)

	// Tolak jika waktu absen sudah melewati jam keluar shift
	if nowMin > keluarMin {
		c.JSON(http.StatusBadRequest, structs.ErrorResponse{
			Success: false,
			Message: fmt.Sprintf("Absensi sudah ditutup. Batas absen masuk adalah pukul %s.", jamKeluar),
			Errors:  map[string]string{"time": "Waktu absen melewati batas jam keluar shift"},
		})
		return
	}
	// ── [END VALIDASI BATAS WAKTU] ────────────────────────────────────

	// Cek duplikat — pastikan belum absen hari ini
	var existing models.Attendance
	if err := database.DB.Where("employee_id = ? AND date = ?", req.EmployeeID, req.Date).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, structs.ErrorResponse{
			Success: false,
			Message: "Karyawan sudah absen masuk hari ini",
			Errors:  map[string]string{"attendance": "Duplikat absensi pada tanggal yang sama"},
		})
		return
	}

	// Upload foto ke Supabase
	var photoURL string
	if req.EntryPhoto != "" {
		url, err := helpers.UploadBase64ToSupabase(req.EntryPhoto, req.EmployeeID)
		if err != nil {
			fmt.Println("❌ ERROR UPLOAD SUPABASE:", err.Error())
			c.JSON(http.StatusInternalServerError, structs.ErrorResponse{
				Success: false,
				Message: "Gagal mengupload foto",
				Errors:  map[string]string{"storage": err.Error()},
			})
			return
		}
		photoURL = url
	}

	// Simpan ke database
	attendance := models.Attendance{
		EmployeeID: req.EmployeeID,
		Date:       req.Date,
		EntryTime:  req.EntryTime,
		Status:     req.Status,
		EntryPhoto: photoURL,
	}

	if err := database.DB.Create(&attendance).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse{
			Success: false,
			Message: "Gagal menyimpan absensi",
			Errors:  map[string]string{"database": err.Error()},
		})
		return
	}

	c.JSON(http.StatusCreated, structs.SuccessResponse{
		Success: true,
		Message: "Absen Masuk Berhasil",
		Data:    attendance,
	})
}

// 2. GET ALL: Untuk tabel dashboard admin
func GetAttendances(c *gin.Context) {
	var attendances []models.Attendance

	if err := database.DB.Preload("Employee.Outlet").Find(&attendances).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse{
			Success: false,
			Message: "Gagal mengambil data absensi",
			Errors:  map[string]string{"server": err.Error()},
		})
		return
	}

	var responses []structs.AttendanceResponse
	for _, a := range attendances {
		responses = append(responses, structs.AttendanceResponse{
			ID:         a.ID,
			EmployeeID: a.EmployeeID,
			Date:       a.Date,
			DateLabel:  a.Date,
			Name:       a.Employee.Name,
			Outlet:     a.Employee.Outlet.Name,
			Entry:      a.EntryTime,
			Exit:       a.ExitTime,
			Status:     a.Status,
			EntryPhoto: a.EntryPhoto,
			ExitPhoto:  a.ExitPhoto,
		})
	}

	if responses == nil {
		responses = []structs.AttendanceResponse{}
	}

	c.JSON(http.StatusOK, structs.SuccessResponse{
		Success: true,
		Message: "List Data Absensi",
		Data:    responses,
	})
}

// 3. UPDATE: Karyawan absen keluar
func UpdateAttendance(c *gin.Context) {
	id := c.Param("id")
	var attendance models.Attendance

	if err := database.DB.First(&attendance, id).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse{
			Success: false,
			Message: "Data absensi tidak ditemukan",
			Errors:  map[string]string{"attendance": "ID tidak valid"},
		})
		return
	}

	var req structs.AttendanceUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ErrorResponse{
			Success: false,
			Message: "Validasi Gagal",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	// Upload foto keluar ke Supabase
	var photoURL string
	if req.ExitPhoto != "" {
		url, err := helpers.UploadBase64ToSupabase(req.ExitPhoto, attendance.EmployeeID)
		if err != nil {
			fmt.Println("❌ ERROR UPLOAD SUPABASE (EXIT):", err.Error())
			c.JSON(http.StatusInternalServerError, structs.ErrorResponse{
				Success: false,
				Message: "Gagal mengupload foto absen keluar",
				Errors:  map[string]string{"storage": err.Error()},
			})
			return
		}
		photoURL = url
	}

	attendance.ExitTime = req.ExitTime

	if photoURL != "" {
		attendance.ExitPhoto = photoURL
	}

	if err := database.DB.Save(&attendance).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse{
			Success: false,
			Message: "Gagal menyimpan absen keluar",
			Errors:  map[string]string{"database": err.Error()},
		})
		return
	}

	c.JSON(http.StatusOK, structs.SuccessResponse{
		Success: true,
		Message: "Absen Keluar Berhasil",
		Data:    attendance,
	})
}
