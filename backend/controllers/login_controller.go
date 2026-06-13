package controllers

import (
	"clecopii-absensi-v2/database"
	"clecopii-absensi-v2/helpers"
	"clecopii-absensi-v2/models"
	"clecopii-absensi-v2/structs"
	"net/http"

	"github.com/gin-gonic/gin"
)

func Login(c *gin.Context) {
	var req struct {
		Pin string `json:"pin" binding:"required,len=6"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ErrorResponse{
			Success: false,
			Message: "Format tidak valid",
			Errors:  map[string]string{"pin": "PIN harus 6 digit angka"},
		})
		return
	}

	hashedInputPin, _ := helpers.HashPin(req.Pin)

	// ── 1. Cek OWNER di tabel users (role = 'owner') ──────────────────
	var user models.User
	if err := database.DB.Where("pin = ? AND role = ?", hashedInputPin, "owner").First(&user).Error; err == nil {
		token, errToken := helpers.GenerateToken(user.ID, user.Role)
		if errToken != nil {
			c.JSON(http.StatusInternalServerError, structs.ErrorResponse{
				Success: false,
				Message: "Server Error",
				Errors:  map[string]string{"server": "Gagal membuat token akses"},
			})
			return
		}

		c.JSON(http.StatusOK, structs.SuccessResponse{
			Success: true,
			Message: "Login Success as Owner",
			Data: gin.H{
				"token": token,
				"user": gin.H{
					"id":   user.ID,
					"name": user.Role,
					"role": user.Role,
				},
			},
		})
		return
	}

	// ── 2. Cek KARYAWAN — cari PIN di tabel users (role = 'employee') ─
	// PIN disimpan di tabel users, bukan employees
	var employeeUser models.User
	if err := database.DB.Where("pin = ? AND role = ?", hashedInputPin, "employee").First(&employeeUser).Error; err == nil {

		// Ambil data employee berdasarkan user_id
		var employee models.Employee
		if err := database.DB.Where("user_id = ?", employeeUser.ID).First(&employee).Error; err != nil {
			c.JSON(http.StatusUnauthorized, structs.ErrorResponse{
				Success: false,
				Message: "Data karyawan tidak ditemukan",
				Errors:  map[string]string{"pin": "Akun tidak terhubung ke data karyawan"},
			})
			return
		}

		// [SOFT DELETE] Tolak login jika karyawan sudah dinonaktifkan
		if !employee.IsActive {
			c.JSON(http.StatusUnauthorized, structs.ErrorResponse{
				Success: false,
				Message: "Akun dinonaktifkan",
				Errors:  map[string]string{"pin": "Akun Anda telah dinonaktifkan. Hubungi admin."},
			})
			return
		}

		token, errToken := helpers.GenerateToken(employeeUser.ID, "employee")
		if errToken != nil {
			c.JSON(http.StatusInternalServerError, structs.ErrorResponse{
				Success: false,
				Message: "Server Error",
				Errors:  map[string]string{"server": "Gagal membuat token akses"},
			})
			return
		}

		c.JSON(http.StatusOK, structs.SuccessResponse{
			Success: true,
			Message: "Login Success as Employee",
			Data: gin.H{
				"token": token,
				"user": gin.H{
					"id":        employeeUser.ID,
					"name":      employee.Name,
					"role":      "employee",
					"outlet_id": employee.OutletID,
				},
			},
		})
		return
	}

	// ── 3. PIN tidak ditemukan di mana pun ────────────────────────────
	c.JSON(http.StatusUnauthorized, structs.ErrorResponse{
		Success: false,
		Message: "Invalid PIN",
		Errors:  map[string]string{"pin": "PIN yang Anda masukkan salah atau tidak terdaftar"},
	})
}

func SeedOwner(c *gin.Context) {
	hashedPin, err := helpers.HashPin("123456")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal hash PIN"})
		return
	}

	owner := models.User{
		Role: "owner",
		PIN:  hashedPin,
	}

	if err := database.DB.Create(&owner).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan ke database"})
		return
	}

	c.JSON(http.StatusOK, structs.SuccessResponse{
		Success: true,
		Message: "Akun Owner berhasil dibuat!",
		Data: gin.H{
			"user_id": owner.ID,
			"role":    owner.Role,
			"pin":     "123456",
		},
	})
}