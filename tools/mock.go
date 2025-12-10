package main

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"os"
	"time"
)

// Data structures matching TypeScript interfaces

type Department struct {
	Code      string `json:"code"`
	Name      string `json:"name"`
	CreatedAt int64  `json:"createdAt,omitempty"`
	UpdatedAt int64  `json:"updatedAt,omitempty"`
}

type Member struct {
	Code        string   `json:"code"`
	ID          string   `json:"id"`
	Name        string   `json:"name"`
	Phone       string   `json:"phone"`
	Email       string   `json:"email"`
	Role        string   `json:"role"`
	Departments []string `json:"departments,omitempty"`
	DateOfBirth string   `json:"date_of_birth"`
	IsActive    bool     `json:"isActive,omitempty"`
	CreatedAt   int64    `json:"createdAt,omitempty"`
	UpdatedAt   int64    `json:"updatedAt,omitempty"`
}

type Workflow struct {
	Name       string `json:"name"`
	Department string `json:"department,omitempty"`
}

type FirebaseWorkflowData struct {
	DepartmentCode string   `json:"departmentCode,omitempty"`
	WorkflowCode   []string `json:"workflowCode"`
	WorkflowName   []string `json:"workflowName"`
	Members        []string `json:"members"`
	IsDone         bool     `json:"isDone"`
	UpdatedAt      int64    `json:"updatedAt"`
}

type Image struct {
	UID  string `json:"uid"`
	Name string `json:"name"`
	URL  string `json:"url"`
}

type FirebaseProductData struct {
	Name                 string                          `json:"name"`
	Quantity             int                             `json:"quantity"`
	Price                int                             `json:"price"`
	CommissionPercentage float64                         `json:"commissionPercentage,omitempty"`
	Images               []Image                         `json:"images"`
	ImagesDone           []Image                         `json:"imagesDone,omitempty"`
	Workflows            map[string]FirebaseWorkflowData `json:"workflows"`
}

type FirebaseOrderData struct {
	Code           string                         `json:"code"`
	CustomerName   string                         `json:"customerName"`
	Phone          string                         `json:"phone"`
	Email          string                         `json:"email"`
	Address        string                         `json:"address"`
	CustomerSource string                         `json:"customerSource"`
	OrderDate      int64                          `json:"orderDate"`
	DeliveryDate   int64                          `json:"deliveryDate"`
	CreatedBy      string                         `json:"createdBy"`
	CreatedByName  string                         `json:"createdByName"`
	ConsultantID   string                         `json:"consultantId,omitempty"`
	ConsultantName string                         `json:"consultantName,omitempty"`
	CreatedAt      int64                          `json:"createdAt,omitempty"`
	UpdatedAt      int64                          `json:"updatedAt,omitempty"`
	Notes          string                         `json:"notes,omitempty"`
	Discount       int                            `json:"discount,omitempty"`
	DiscountType   string                         `json:"discountType,omitempty"`
	ShippingFee    int                            `json:"shippingFee,omitempty"`
	Products       map[string]FirebaseProductData `json:"products"`
	Status         string                         `json:"status,omitempty"`
	TotalAmount    int                            `json:"totalAmount,omitempty"`
	DiscountAmount int                            `json:"discountAmount,omitempty"`
	Subtotal       int                            `json:"subtotal,omitempty"`
	Deposit        int                            `json:"deposit,omitempty"`
	DepositType    string                         `json:"depositType,omitempty"`
	DepositAmount  int                            `json:"depositAmount,omitempty"`
	IsDepositPaid  bool                           `json:"isDepositPaid,omitempty"`
	CustomerCode   string                         `json:"customerCode,omitempty"`
	Issues         []string                       `json:"issues,omitempty"`
}

type MockData struct {
	Xoxo struct {
		Departments map[string]Department        `json:"departments"`
		Members     map[string]Member            `json:"members"`
		Workflows   map[string]Workflow          `json:"workflows"`
		Orders      map[string]FirebaseOrderData `json:"orders"`
	} `json:"xoxo"`
}

var (
	firstNames  = []string{"Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Võ", "Đặng", "Bùi", "Đỗ", "Hồ"}
	lastNames   = []string{"Văn", "Thị", "Minh", "Hồng", "Lan", "Anh", "Dũng", "Hùng", "Thảo", "Linh"}
	middleNames = []string{"Anh", "Minh", "Thị", "Văn", "Hồng", "Lan", "Dũng", "Hùng", "Thảo", "Linh"}

	departments = []struct {
		Code string
		Name string
	}{
		{"DEPT_001", "Phòng Cắt"},
		{"DEPT_002", "Phòng May"},
		{"DEPT_003", "Phòng Là Ủi"},
		{"DEPT_004", "Phòng Kiểm Tra"},
		{"DEPT_005", "Phòng Đóng Gói"},
	}

	workflowNames = map[string][]string{
		"DEPT_001": {"Cắt vải", "Cắt chỉ", "Cắt phụ liệu"},
		"DEPT_002": {"May thân", "May tay áo", "May cổ áo", "May đường viền"},
		"DEPT_003": {"Là ủi thân", "Là ủi tay áo", "Là ủi hoàn thiện"},
		"DEPT_004": {"Kiểm tra chất lượng", "Kiểm tra kích thước", "Kiểm tra đường may"},
		"DEPT_005": {"Đóng gói", "Dán nhãn", "Bọc bảo vệ"},
	}

	productNames = []string{
		"Áo thun nữ size M",
		"Áo sơ mi nam size L",
		"Quần jeans nam size 32",
		"Váy công sở size S",
		"Áo khoác nữ size M",
		"Quần short nam size 30",
		"Áo len nữ size L",
		"Quần tây nam size 34",
	}

	customerSources = []string{"facebook", "zalo", "instagram", "tiktok", "website", "referral", "walk_in", "phone", "other"}
	roles           = []string{"sales", "worker", "admin", "development"}
	orderStatuses   = []string{"pending", "confirmed", "in_progress", "on_hold", "completed", "cancelled"}
)

func randomName() string {
	firstName := firstNames[rand.Intn(len(firstNames))]
	middleName := middleNames[rand.Intn(len(middleNames))]
	lastName := lastNames[rand.Intn(len(lastNames))]
	return fmt.Sprintf("%s %s %s", firstName, middleName, lastName)
}

func randomPhone() string {
	return fmt.Sprintf("09%08d", rand.Intn(100000000))
}

func randomEmail(name string) string {
	cleanName := ""
	for _, r := range name {
		if r >= 'a' && r <= 'z' || r >= 'A' && r <= 'Z' || r >= '0' && r <= '9' {
			cleanName += string(r)
		}
	}
	return fmt.Sprintf("%s%d@gmail.com", cleanName, rand.Intn(1000))
}

func randomDateOfBirth() string {
	year := 1980 + rand.Intn(30)
	month := 1 + rand.Intn(12)
	day := 1 + rand.Intn(28)
	return fmt.Sprintf("%04d-%02d-%02d", year, month, day)
}

func generateID(prefix string, index int) string {
	return fmt.Sprintf("%s_%03d", prefix, index+1)
}

func generateMockData() MockData {
	rand.Seed(time.Now().UnixNano())
	now := time.Now().Unix() * 1000

	data := MockData{}

	// Generate Departments
	data.Xoxo.Departments = make(map[string]Department)
	for _, dept := range departments {
		data.Xoxo.Departments[dept.Code] = Department{
			Code:      dept.Code,
			Name:      dept.Name,
			CreatedAt: now - int64(rand.Intn(30*24*3600*1000)), // Random time in last 30 days
		}
	}

	// Generate Members
	data.Xoxo.Members = make(map[string]Member)

	// Generate sales and admin members (no departments)
	salesCount := 3
	adminCount := 2
	devCount := 2

	for i := 0; i < salesCount; i++ {
		id := generateID("SALES", i)
		name := randomName()
		member := Member{
			Code:        id,
			ID:          id,
			Name:        name,
			Phone:       randomPhone(),
			Email:       randomEmail(name),
			Role:        "sales",
			DateOfBirth: randomDateOfBirth(),
			IsActive:    true,
			CreatedAt:   now - int64(rand.Intn(30*24*3600*1000)),
		}
		data.Xoxo.Members[id] = member
	}

	for i := 0; i < adminCount; i++ {
		id := generateID("ADMIN", i)
		name := randomName()
		member := Member{
			Code:        id,
			ID:          id,
			Name:        name,
			Phone:       randomPhone(),
			Email:       randomEmail(name),
			Role:        "admin",
			DateOfBirth: randomDateOfBirth(),
			IsActive:    true,
			CreatedAt:   now - int64(rand.Intn(30*24*3600*1000)),
		}
		data.Xoxo.Members[id] = member
	}

	for i := 0; i < devCount; i++ {
		id := generateID("DEV", i)
		name := randomName()
		member := Member{
			Code:        id,
			ID:          id,
			Name:        name,
			Phone:       randomPhone(),
			Email:       randomEmail(name),
			Role:        "development",
			DateOfBirth: randomDateOfBirth(),
			IsActive:    true,
			CreatedAt:   now - int64(rand.Intn(30*24*3600*1000)),
		}
		data.Xoxo.Members[id] = member
	}

	// Generate worker members (with departments)
	workersPerDept := 3
	workerIndex := 0
	for _, dept := range departments {
		for j := 0; j < workersPerDept; j++ {
			id := generateID("WORKER", workerIndex)
			name := randomName()
			member := Member{
				Code:        id,
				ID:          id,
				Name:        name,
				Phone:       randomPhone(),
				Email:       randomEmail(name),
				Role:        "worker",
				Departments: []string{dept.Code}, // Each worker belongs to one department
				DateOfBirth: randomDateOfBirth(),
				IsActive:    true,
				CreatedAt:   now - int64(rand.Intn(30*24*3600*1000)),
			}
			data.Xoxo.Members[id] = member
			workerIndex++
		}
	}

	// Generate Workflows (linked to departments)
	data.Xoxo.Workflows = make(map[string]Workflow)
	workflowIndex := 0
	for _, dept := range departments {
		workflowNamesForDept := workflowNames[dept.Code]
		for _, workflowName := range workflowNamesForDept {
			id := generateID("WF", workflowIndex)
			data.Xoxo.Workflows[id] = Workflow{
				Name:       workflowName,
				Department: dept.Code,
			}
			workflowIndex++
		}
	}

	// Generate Orders
	data.Xoxo.Orders = make(map[string]FirebaseOrderData)
	numOrders := 5

	// Get sales member IDs for createdBy
	salesMemberIDs := make([]string, 0)
	for id, member := range data.Xoxo.Members {
		if member.Role == "sales" {
			salesMemberIDs = append(salesMemberIDs, id)
		}
	}

	for i := 0; i < numOrders; i++ {
		orderID := fmt.Sprintf("ORD_%03d", i+1)
		orderCode := fmt.Sprintf("ORD%04d%02d%02d%03d",
			time.Now().Year(),
			int(time.Now().Month()),
			time.Now().Day(),
			i+1)

		createdBy := salesMemberIDs[rand.Intn(len(salesMemberIDs))]
		createdByName := data.Xoxo.Members[createdBy].Name

		orderDate := now - int64(rand.Intn(7*24*3600*1000))               // Random time in last 7 days
		deliveryDate := orderDate + int64((3+rand.Intn(10))*24*3600*1000) // 3-13 days after order

		// Generate products for this order
		numProducts := 1 + rand.Intn(3) // 1-3 products per order
		products := make(map[string]FirebaseProductData)

		for j := 0; j < numProducts; j++ {
			productID := fmt.Sprintf("PROD_%s_%d", orderID, j+1)
			productName := productNames[rand.Intn(len(productNames))]
			quantity := 10 + rand.Intn(100)      // 10-110
			price := (50000 + rand.Intn(500000)) // 50k-550k

			// Generate workflows for this product
			productWorkflows := make(map[string]FirebaseWorkflowData)

			// Select random departments and their workflows
			selectedDepts := make([]string, 0)
			numDepts := 2 + rand.Intn(3) // 2-4 departments
			deptIndices := rand.Perm(len(departments))[:numDepts]

			for _, idx := range deptIndices {
				dept := departments[idx]
				selectedDepts = append(selectedDepts, dept.Code)
			}

			workflowIndexInProduct := 0
			for _, deptCode := range selectedDepts {
				// Get workflows for this department
				availableWorkflows := make([]string, 0)
				for wfID, wf := range data.Xoxo.Workflows {
					if wf.Department == deptCode {
						availableWorkflows = append(availableWorkflows, wfID)
					}
				}

				if len(availableWorkflows) > 0 {
					// Select 1-2 workflows from this department
					numWorkflows := 1 + rand.Intn(2)
					if numWorkflows > len(availableWorkflows) {
						numWorkflows = len(availableWorkflows)
					}

					selectedWorkflowIDs := availableWorkflows[:numWorkflows]
					workflowCodes := make([]string, 0)
					workflowNames := make([]string, 0)

					for _, wfID := range selectedWorkflowIDs {
						workflowCodes = append(workflowCodes, wfID)
						workflowNames = append(workflowNames, data.Xoxo.Workflows[wfID].Name)
					}

					// Get members from this department
					availableMembers := make([]string, 0)
					for memberID, member := range data.Xoxo.Members {
						if member.Role == "worker" {
							for _, memberDept := range member.Departments {
								if memberDept == deptCode {
									availableMembers = append(availableMembers, memberID)
									break
								}
							}
						}
					}

					// Assign 1-2 members to this workflow
					numMembers := 1 + rand.Intn(2)
					if numMembers > len(availableMembers) {
						numMembers = len(availableMembers)
					}

					assignedMembers := make([]string, 0)
					if numMembers > 0 {
						memberIndices := rand.Perm(len(availableMembers))[:numMembers]
						for _, idx := range memberIndices {
							assignedMembers = append(assignedMembers, availableMembers[idx])
						}
					}

					// Determine if workflow is done (earlier workflows more likely to be done)
					isDone := workflowIndexInProduct < 2 && rand.Float32() < 0.7

					workflowID := fmt.Sprintf("workflow_%s_%d", productID, workflowIndexInProduct)
					productWorkflows[workflowID] = FirebaseWorkflowData{
						DepartmentCode: deptCode,
						WorkflowCode:   workflowCodes,
						WorkflowName:   workflowNames,
						Members:        assignedMembers,
						IsDone:         isDone,
						UpdatedAt:      orderDate + int64(workflowIndexInProduct*3600*1000),
					}
					workflowIndexInProduct++
				}
			}

			// Generate images
			imageURL := "https://firebasestorage.googleapis.com/v0/b/morata-8e8e4.appspot.com/o/images%2Fproduct.jpg?alt=media&token=2d68623c-9ee8-4c1d-905b-c5155ba427ed"
			numImages := 1 + rand.Intn(3)
			images := make([]Image, 0)
			for k := 0; k < numImages; k++ {
				images = append(images, Image{
					UID:  fmt.Sprintf("img_%s_%d", productID, k),
					Name: fmt.Sprintf("product_%d.jpg", k+1),
					URL:  imageURL,
				})
			}

			// Generate imagesDone for some products (completed workflows)
			var imagesDone []Image
			hasCompletedWorkflows := false
			for _, wf := range productWorkflows {
				if wf.IsDone {
					hasCompletedWorkflows = true
					break
				}
			}
			if hasCompletedWorkflows && rand.Float32() < 0.6 {
				numImagesDone := 1 + rand.Intn(2)
				imagesDone = make([]Image, 0)
				for k := 0; k < numImagesDone; k++ {
					imagesDone = append(imagesDone, Image{
						UID:  fmt.Sprintf("img_done_%s_%d", productID, k),
						Name: fmt.Sprintf("product_done_%d.jpg", k+1),
						URL:  imageURL,
					})
				}
			}

			products[productID] = FirebaseProductData{
				Name:                 productName,
				Quantity:             quantity,
				Price:                price,
				CommissionPercentage: 5.0 + rand.Float64()*10.0, // 5-15%
				Images:               images,
				ImagesDone:           imagesDone,
				Workflows:            productWorkflows,
			}
		}

		// Calculate order totals
		subtotal := 0
		for _, product := range products {
			subtotal += product.Price * product.Quantity
		}

		discountType := "percentage"
		discount := 0
		if rand.Float32() < 0.5 {
			discount = 5 + rand.Intn(15) // 5-20%
		}
		discountAmount := 0
		if discount > 0 {
			discountAmount = (subtotal * discount) / 100
		}

		shippingFee := 0
		if rand.Float32() < 0.7 {
			shippingFee = 20000 + rand.Intn(50000) // 20k-70k
		}

		totalAmount := subtotal - discountAmount + shippingFee

		deposit := 0
		depositAmount := 0
		isDepositPaid := false
		if rand.Float32() < 0.6 {
			deposit = 30 + rand.Intn(40) // 30-70%
			depositAmount = (totalAmount * deposit) / 100
			isDepositPaid = rand.Float32() < 0.8
		}

		status := orderStatuses[rand.Intn(len(orderStatuses))]

		order := FirebaseOrderData{
			Code:           orderCode,
			CustomerName:   randomName(),
			Phone:          randomPhone(),
			Email:          randomEmail(randomName()),
			Address:        fmt.Sprintf("%d Đường %s, Quận %d, TP.HCM", 100+rand.Intn(900), randomName(), 1+rand.Intn(12)),
			CustomerSource: customerSources[rand.Intn(len(customerSources))],
			OrderDate:      orderDate,
			DeliveryDate:   deliveryDate,
			CreatedBy:      createdBy,
			CreatedByName:  createdByName,
			CreatedAt:      orderDate,
			UpdatedAt:      orderDate + int64(rand.Intn(24*3600*1000)),
			Notes:          fmt.Sprintf("Ghi chú cho đơn hàng %s", orderCode),
			Discount:       discount,
			DiscountType:   discountType,
			ShippingFee:    shippingFee,
			Products:       products,
			Status:         status,
			TotalAmount:    totalAmount,
			DiscountAmount: discountAmount,
			Subtotal:       subtotal,
			Deposit:        deposit,
			DepositType:    "percentage",
			DepositAmount:  depositAmount,
			IsDepositPaid:  isDepositPaid,
		}

		// Add consultant for some orders
		if rand.Float32() < 0.5 {
			consultantID := salesMemberIDs[rand.Intn(len(salesMemberIDs))]
			order.ConsultantID = consultantID
			order.ConsultantName = data.Xoxo.Members[consultantID].Name
		}

		data.Xoxo.Orders[orderID] = order
	}

	return data
}

func main() {
	data := generateMockData()

	jsonData, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error marshaling JSON: %v\n", err)
		os.Exit(1)
	}

	// Write to file
	outputFile := "./mock-data.json"
	if len(os.Args) > 1 {
		outputFile = os.Args[1]
	}

	err = os.WriteFile(outputFile, jsonData, 0644)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error writing file: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Mock data generated successfully! Written to %s\n", outputFile)
	fmt.Printf("Generated:\n")
	fmt.Printf("  - %d departments\n", len(data.Xoxo.Departments))
	fmt.Printf("  - %d members\n", len(data.Xoxo.Members))
	fmt.Printf("  - %d workflows\n", len(data.Xoxo.Workflows))
	fmt.Printf("  - %d orders\n", len(data.Xoxo.Orders))
}
