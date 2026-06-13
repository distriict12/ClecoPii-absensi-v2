package controllers

import (
	"clecopii-absensi-v2/database"
	"clecopii-absensi-v2/helpers"
	"clecopii-absensi-v2/models"
	"clecopii-absensi-v2/structs"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

func CreateEmployee(c *gin.Context) {
	var req structs.EmployeeCreateRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ErrorResponse{
			Success: false,
			Message: "Validation Errors",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	hashedPin, err := helpers.HashPin(req.Pin)
	if err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse{
			Success: false,
			Message: "Server Error",
			Errors:  map[string]string{"server": "Gagal memproses enkripsi PIN"},
		})
		return
	}

	user := models.User{
		PIN:  hashedPin,
		Role: "employee",
	}
	if err := database.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse{
			Success: false,
			Message: "Failed to create user login account",
			Errors:  map[string]string{"database": err.Error()},
		})
		return
	}

	employee := models.Employee{
		UserID:          user.ID,
		Name:            req.Name,
		Position:        req.Position,
		EmployeeCode:    req.EmployeeCode,
		OutletID:        req.OutletID,
		SalaryType:      req.SalaryType,
		GajiPokok:       req.GajiPokok,
		PotonganTelat:   req.PotonganTelat,
		PotonganAbsen:   req.PotonganAbsen,
		BonusRajin:      req.BonusRajin,
		JamMasuk:        req.JamMasuk,
		JamKeluar:       req.JamKeluar,
		WorkingDays:     req.WorkingDays,
		TargetHariKerja: req.TargetHariKerja,
		IsActive:        true,
	}

	if err := database.DB.Create(&employee).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse{
			Success: false,
			Message: "Failed to create employee profile",
			Errors:  map[string]string{"database": err.Error()},
		})
		return
	}

	c.JSON(http.StatusCreated, structs.SuccessResponse{
		Success: true,
		Message: "Karyawan baru berhasil ditambahkan",
		Data: structs.EmployeeResponse{
			ID:           employee.ID,
			EmployeeCode: employee.EmployeeCode,
			Name:         employee.Name,
			Position:     employee.Position,
			OutletName:   "-",
			GajiPokok:    employee.GajiPokok,
			SalaryType:   employee.SalaryType,
			IsActive:     employee.IsActive,
		},
	})
}

// GetEmployees — default hanya karyawan aktif
// Tambahkan query param ?show_inactive=true untuk lihat semua termasuk nonaktif
func GetEmployees(c *gin.Context) {
	var employees []models.Employee

	showInactive := c.Query("show_inactive") == "true"
	query := database.DB
	if !showInactive {
		query = query.Where("is_active = ?", true)
	}

	if err := query.Find(&employees).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse{
			Success: false,
			Message: "Gagal mengambil data karyawan",
			Errors:  map[string]string{"server": err.Error()},
		})
		return
	}

	var employeeResponses []structs.EmployeeResponse
	for _, emp := range employees {
		employeeResponses = append(employeeResponses, structs.EmployeeResponse{
			ID:              emp.ID,
			EmployeeCode:    emp.EmployeeCode,
			Name:            emp.Name,
			Position:        emp.Position,
			OutletID:        emp.OutletID,
			OutletName:      "-",
			GajiPokok:       emp.GajiPokok,
			SalaryType:      emp.SalaryType,
			PotonganTelat:   emp.PotonganTelat,
			PotonganAbsen:   emp.PotonganAbsen,
			BonusRajin:      emp.BonusRajin,
			JamMasuk:        emp.JamMasuk,
			JamKeluar:       emp.JamKeluar,
			WorkingDays:     emp.WorkingDays,
			TargetHariKerja: emp.TargetHariKerja,
			IsActive:        emp.IsActive,
		})
	}

	if employeeResponses == nil {
		employeeResponses = []structs.EmployeeResponse{}
	}

	c.JSON(http.StatusOK, structs.SuccessResponse{
		Success: true,
		Message: "List Data Karyawan",
		Data:    employeeResponses,
	})
}

func GetEmployeeById(c *gin.Context) {
	id := c.Param("id")
	var employee models.Employee

	if err := database.DB.First(&employee, id).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse{
			Success: false,
			Message: "Karyawan tidak ditemukan",
			Errors:  map[string]string{"employee": "Data tidak valid atau sudah dihapus"},
		})
		return
	}

	c.JSON(http.StatusOK, structs.SuccessResponse{
		Success: true,
		Message: "Detail Karyawan",
		Data:    employee,
	})
}

func UpdateEmployee(c *gin.Context) {
	id := c.Param("id")
	var employee models.Employee

	if err := database.DB.First(&employee, id).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse{
			Success: false,
			Message: "Karyawan tidak ditemukan",
			Errors:  map[string]string{"employee": "Data tidak valid atau sudah dihapus"},
		})
		return
	}

	var req structs.EmployeeUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ErrorResponse{
			Success: false,
			Message: "Validation Errors",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	employee.Name            = req.Name
	employee.Position        = req.Position
	employee.EmployeeCode    = req.EmployeeCode
	employee.OutletID        = req.OutletID
	employee.SalaryType      = req.SalaryType
	employee.GajiPokok       = req.GajiPokok
	employee.PotonganTelat   = req.PotonganTelat
	employee.PotonganAbsen   = req.PotonganAbsen
	employee.BonusRajin      = req.BonusRajin
	employee.JamMasuk        = req.JamMasuk
	employee.JamKeluar       = req.JamKeluar
	employee.WorkingDays     = req.WorkingDays
	employee.TargetHariKerja = req.TargetHariKerja

	if err := database.DB.Save(&employee).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse{
			Success: false,
			Message: "Gagal menyimpan perubahan",
			Errors:  map[string]string{"database": err.Error()},
		})
		return
	}

	// Update PIN hanya kalau diisi
	if req.Pin != "" {
		hashedPin, err := helpers.HashPin(req.Pin)
		if err != nil {
			c.JSON(http.StatusInternalServerError, structs.ErrorResponse{
				Success: false,
				Message: "Gagal mengenkripsi PIN baru",
				Errors:  map[string]string{"server": err.Error()},
			})
			return
		}
		if err := database.DB.Model(&models.User{}).
			Where("id = ?", employee.UserID).
			Update("pin", hashedPin).Error; err != nil {
			c.JSON(http.StatusInternalServerError, structs.ErrorResponse{
				Success: false,
				Message: "Gagal memperbarui PIN",
				Errors:  map[string]string{"database": err.Error()},
			})
			return
		}
	}

	c.JSON(http.StatusOK, structs.SuccessResponse{
		Success: true,
		Message: "Data Karyawan berhasil diperbarui",
		Data:    employee,
	})
}

// [SOFT DELETE] DeleteEmployee tidak benar-benar menghapus data
// Hanya set is_active = false agar data absensi & payroll tetap utuh
func DeleteEmployee(c *gin.Context) {
	id := c.Param("id")
	var employee models.Employee

	if err := database.DB.First(&employee, id).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse{
			Success: false,
			Message: "Karyawan tidak ditemukan",
			Errors:  map[string]string{"employee": "Data tidak valid atau sudah dihapus"},
		})
		return
	}

	// Nonaktifkan employee
	if err := database.DB.Model(&employee).Update("is_active", false).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse{
			Success: false,
			Message: "Gagal menonaktifkan karyawan",
			Errors:  map[string]string{"database": err.Error()},
		})
		return
	}

	c.JSON(http.StatusOK, structs.SuccessResponse{
		Success: true,
		Message: "Karyawan berhasil dinonaktifkan",
		Data:    nil,
	})
}


// ReactivateEmployee — mengaktifkan kembali karyawan yang sudah dinonaktifkan
func ReactivateEmployee(c *gin.Context) {
	id := c.Param("id")
	var employee models.Employee

	if err := database.DB.First(&employee, id).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse{
			Success: false,
			Message: "Karyawan tidak ditemukan",
			Errors:  map[string]string{"employee": "Data tidak valid"},
		})
		return
	}

	if employee.IsActive {
		c.JSON(http.StatusBadRequest, structs.ErrorResponse{
			Success: false,
			Message: "Karyawan ini sudah aktif",
		})
		return
	}

	if err := database.DB.Model(&employee).Update("is_active", true).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse{
			Success: false,
			Message: "Gagal mengaktifkan karyawan",
			Errors:  map[string]string{"database": err.Error()},
		})
		return
	}

	c.JSON(http.StatusOK, structs.SuccessResponse{
		Success: true,
		Message: "Karyawan berhasil diaktifkan kembali",
		Data:    nil,
	})
}

func GetMyProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, structs.ErrorResponse{
			Success: false,
			Message: "Tidak ada akses (Unauthorized)",
		})
		return
	}

	var employee models.Employee
	if err := database.DB.Preload("Outlet").Where("user_id = ?", userID).First(&employee).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse{
			Success: false,
			Message: "Data profil karyawan tidak ditemukan",
		})
		return
	}

	// [SOFT DELETE] Tolak login karyawan yang sudah dinonaktifkan
	if !employee.IsActive {
		c.JSON(http.StatusForbidden, structs.ErrorResponse{
			Success: false,
			Message: "Akun karyawan ini telah dinonaktifkan. Hubungi admin.",
		})
		return
	}

	today := time.Now().Format("2006-01-02")
	var todayAttendance models.Attendance
	hasAttended := false
	if err := database.DB.Where("employee_id = ? AND date = ?", employee.ID, today).First(&todayAttendance).Error; err == nil {
		hasAttended = true
	}

	// Normalisasi work_days — selalu kirim sebagai JSON array ke frontend
	workDays := employee.WorkingDays
	if len(workDays) > 0 && !strings.HasPrefix(strings.TrimSpace(workDays), "[") {
		parts := strings.Split(workDays, ",")
		for i, p := range parts {
			parts[i] = strings.TrimSpace(p)
		}
		jsonBytes, _ := json.Marshal(parts)
		workDays = string(jsonBytes)
	}

	// Normalisasi jam — potong detik (HH:MM:SS → HH:MM)
	jamMasuk  := employee.JamMasuk
	jamKeluar := employee.JamKeluar
	if len(jamMasuk) > 5  { jamMasuk  = jamMasuk[:5] }
	if len(jamKeluar) > 5 { jamKeluar = jamKeluar[:5] }

	response := gin.H{
		"id":         employee.ID,
		"name":       employee.Name,
		"start_time": jamMasuk,
		"end_time":   jamKeluar,
		"work_days":  workDays,
		"outlet": gin.H{
			"id":      employee.Outlet.ID,
			"name":    employee.Outlet.Name,
			"address": employee.Outlet.Address,
			"lat":     employee.Outlet.Latitude,
			"lng":     employee.Outlet.Longitude,
			"radius":  employee.Outlet.Radius,
		},
	}

	if hasAttended {
		response["today_attendance"] = gin.H{
			"id":        todayAttendance.ID,
			"status":    todayAttendance.Status,
			"exit_time": todayAttendance.ExitTime,
		}
	}

	c.JSON(http.StatusOK, structs.SuccessResponse{
		Success: true,
		Message: "Profil berhasil dimuat",
		Data:    response,
	})
}