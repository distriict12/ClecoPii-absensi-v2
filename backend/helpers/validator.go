package helpers

import (
	"fmt"
	"strings"

	"github.com/go-playground/validator/v10"
	"gorm.io/gorm"
)

// TranslateErrorMessage menangani validasi (validator) dan database error (GORM)
func TranslateErrorMessage(err error) map[string]string {
	// Membuat map untuk menampung pesan error
	errorsMap := make(map[string]string)

	// 1. Handle validasi dari inputan user (validator.v10)
	if validationErrors, ok := err.(validator.ValidationErrors); ok {
		for _, fieldError := range validationErrors {
			field := fieldError.Field() 
			
			switch fieldError.Tag() {
			case "required":
				errorsMap[field] = fmt.Sprintf("%s tidak boleh kosong", field)
			case "unique":
				errorsMap[field] = fmt.Sprintf("%s sudah terdaftar", field)
			case "min":
				errorsMap[field] = fmt.Sprintf("%s minimal harus %s karakter", field, fieldError.Param())
			case "max":
				errorsMap[field] = fmt.Sprintf("%s maksimal %s karakter", field, fieldError.Param())
			case "numeric":
				errorsMap[field] = fmt.Sprintf("%s harus berupa angka", field)
			case "len":
				errorsMap[field] = fmt.Sprintf("%s harus tepat %s karakter", field, fieldError.Param())
			default:
				errorsMap[field] = "Format data tidak valid"
			}
		}
		return errorsMap // Langsung return jika error berasal dari validasi JSON
	}

	// 2. Handle error dari Database (GORM / PostgreSQL)
	if err != nil {
		errString := err.Error()

		// Cek error PostgreSQL: Data tidak ditemukan
		if err == gorm.ErrRecordNotFound {
			errorsMap["data"] = "Data yang dicari tidak ditemukan"
		} else if IsDuplicateEntryError(err) {
			// Cek error PostgreSQL: Duplikasi Data (Unique Constraint)
			
			// Sesuaikan dengan nama kolom yang mungkin bentrok di aplikasimu
			if strings.Contains(errString, "employee_code") {
				errorsMap["employee_code"] = "Kode Karyawan ini sudah digunakan oleh orang lain"
			} else if strings.Contains(errString, "pin") {
				errorsMap["pin"] = "PIN ini sudah digunakan, silakan gunakan kombinasi lain"
			} else {
				errorsMap["duplicate"] = "Data sudah terdaftar di sistem (Duplikat)"
			}
		} else {
			// Error database lainnya
			errorsMap["server"] = "Terjadi gangguan pada server database"
		}
	}

	return errorsMap
}

// IsDuplicateEntryError mendeteksi apakah error PostgreSQL adalah duplicate entry
func IsDuplicateEntryError(err error) bool {
	if err == nil {
		return false
	}
	// "23505" adalah kode standar SQL untuk "unique_violation" (Duplikat) di PostgreSQL
	return strings.Contains(err.Error(), "duplicate key value") || strings.Contains(err.Error(), "23505")
}