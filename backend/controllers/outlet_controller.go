package controllers

import (
	"clecopii-absensi-v2/database"
	"clecopii-absensi-v2/helpers"
	"clecopii-absensi-v2/models"
	"clecopii-absensi-v2/structs"
	"net/http"

	"github.com/gin-gonic/gin"
)

// 1. CREATE OUTLET (POST)
func CreateOutlet(c *gin.Context) {
	var req structs.OutletRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ErrorResponse{
			Success: false,
			Message: "Validasi Gagal",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	outlet := models.Outlet{
		Name:      req.Name,
		Address:   req.Address,
		Latitude:  req.Latitude,
		Longitude: req.Longitude,
		Radius:    req.Radius,
	}

	if err := database.DB.Create(&outlet).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse{
			Success: false,
			Message: "Gagal menyimpan outlet",
			Errors:  map[string]string{"database": err.Error()},
		})
		return
	}

	c.JSON(http.StatusCreated, structs.SuccessResponse{
		Success: true,
		Message: "Outlet baru berhasil ditambahkan",
		Data:    outlet,
	})
}

// 2. GET ALL OUTLETS (READ)
func GetOutlets(c *gin.Context) {
	var outlets []models.Outlet
	if err := database.DB.Find(&outlets).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse{
			Success: false,
			Message: "Gagal mengambil data outlet",
			Errors:  map[string]string{"server": err.Error()},
		})
		return
	}

	var outletResponses []structs.OutletResponse
	for _, o := range outlets {
		outletResponses = append(outletResponses, structs.OutletResponse{
			ID:        o.ID,
			Name:      o.Name,
			Address:   o.Address,
			Latitude:  o.Latitude,
			Longitude: o.Longitude,
			Radius:    o.Radius,
		})
	}

	if outletResponses == nil {
		outletResponses = []structs.OutletResponse{}
	}

	c.JSON(http.StatusOK, structs.SuccessResponse{
		Success: true,
		Message: "List Data Outlet",
		Data:    outletResponses,
	})
}

// 3. GET OUTLET BY ID (READ DETAIL)
func GetOutletById(c *gin.Context) {
	id := c.Param("id")
	var outlet models.Outlet

	if err := database.DB.First(&outlet, id).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse{
			Success: false,
			Message: "Outlet tidak ditemukan",
			Errors:  map[string]string{"outlet": "Data tidak valid"},
		})
		return
	}

	c.JSON(http.StatusOK, structs.SuccessResponse{
		Success: true,
		Message: "Detail Outlet",
		Data:    outlet,
	})
}

// 4. UPDATE OUTLET (PUT)
func UpdateOutlet(c *gin.Context) {
	id := c.Param("id")
	var outlet models.Outlet

	if err := database.DB.First(&outlet, id).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse{
			Success: false,
			Message: "Outlet tidak ditemukan",
			Errors:  map[string]string{"outlet": "Data tidak valid"},
		})
		return
	}

	var req structs.OutletRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ErrorResponse{
			Success: false,
			Message: "Validasi Gagal",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	// Timpa data lama dengan data baru
	outlet.Name = req.Name
	outlet.Address = req.Address
	outlet.Latitude = req.Latitude
	outlet.Longitude = req.Longitude
	outlet.Radius = req.Radius

	if err := database.DB.Save(&outlet).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse{
			Success: false,
			Message: "Gagal memperbarui outlet",
			Errors:  map[string]string{"database": err.Error()},
		})
		return
	}

	c.JSON(http.StatusOK, structs.SuccessResponse{
		Success: true,
		Message: "Data Outlet berhasil diperbarui",
		Data:    outlet,
	})
}

// 5. DELETE OUTLET (DELETE)
func DeleteOutlet(c *gin.Context) {
	id := c.Param("id")
	var outlet models.Outlet

	if err := database.DB.First(&outlet, id).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse{
			Success: false,
			Message: "Outlet tidak ditemukan",
			Errors:  map[string]string{"outlet": "Data tidak valid"},
		})
		return
	}

	if err := database.DB.Delete(&outlet).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse{
			Success: false,
			Message: "Gagal menghapus outlet",
			Errors:  map[string]string{"database": err.Error()},
		})
		return
	}

	c.JSON(http.StatusOK, structs.SuccessResponse{
		Success: true,
		Message: "Data Outlet berhasil dihapus",
		Data:    nil,
	})
}
