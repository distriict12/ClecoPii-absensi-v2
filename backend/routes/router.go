package routes

import (
	"clecopii-absensi-v2/controllers"
	"clecopii-absensi-v2/middlewares"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	router := gin.Default()

	router.Use(cors.New(cors.Config{
		AllowOrigins: []string{
			"http://localhost:5173",
			"https://kt9v7q8r-5173.asse.devtunnels.ms",
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Auth
	router.POST("/api/login", controllers.Login)
	router.POST("/api/seed", controllers.SeedOwner)

	// Employees
	router.POST("/api/employees", middlewares.AuthMiddleware(), controllers.CreateEmployee)
	router.GET("/api/employees", middlewares.AuthMiddleware(), controllers.GetEmployees)
	router.GET("/api/employees/me", middlewares.AuthMiddleware(), controllers.GetMyProfile)
	router.GET("/api/employees/:id", middlewares.AuthMiddleware(), controllers.GetEmployeeById)
	router.PUT("/api/employees/:id", middlewares.AuthMiddleware(), controllers.UpdateEmployee)
	router.DELETE("/api/employees/:id", middlewares.AuthMiddleware(), controllers.DeleteEmployee)
	// [SOFT DELETE] Route baru untuk reaktivasi karyawan nonaktif
	router.PATCH("/api/employees/:id/reactivate", middlewares.AuthMiddleware(), controllers.ReactivateEmployee)

	// Outlets
	router.POST("/api/outlets", middlewares.AuthMiddleware(), controllers.CreateOutlet)
	router.GET("/api/outlets", middlewares.AuthMiddleware(), controllers.GetOutlets)
	router.GET("/api/outlets/:id", middlewares.AuthMiddleware(), controllers.GetOutletById)
	router.PUT("/api/outlets/:id", middlewares.AuthMiddleware(), controllers.UpdateOutlet)
	router.DELETE("/api/outlets/:id", middlewares.AuthMiddleware(), controllers.DeleteOutlet)

	// Attendances
	router.POST("/api/attendances", middlewares.AuthMiddleware(), controllers.CreateAttendance)
	router.GET("/api/attendances", middlewares.AuthMiddleware(), controllers.GetAttendances)
	router.PUT("/api/attendances/:id", middlewares.AuthMiddleware(), controllers.UpdateAttendance)

	// Payroll & Summary
	router.GET("/api/payrolls", middlewares.AuthMiddleware(), controllers.GetPayroll)
	router.GET("/api/summary", middlewares.AuthMiddleware(), controllers.GetSummary)

	return router
}