// Main Application JavaScript
class PacingTrackerApp {
  constructor() {
    this.currentUser = null;
    this.targets = [];
    this.clients = [];
    this.currentEditingTarget = null;
    this.init();
  }

  async init() {
    // Check authentication
    if (!this.checkAuth()) {
      window.location.href = "/login.html";
      return;
    }

    // Initialize the application
    this.setupEventListeners();
    this.setupDropdownClickOutside();
    this.populateMonthOptions();
    this.setupDropdownEventListeners();
    // Load clients on page load
    await this.loadClients();
    await this.loadTargets();
    this.updateUserDisplay();
  }

  checkAuth() {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (!token || !user) {
      return false;
    }

    try {
      this.currentUser = JSON.parse(user);
      return true;
    } catch (error) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return false;
    }
  }

  updateUserDisplay() {
    if (this.currentUser) {
      document.getElementById("userDisplayName").textContent =
        this.currentUser.username;
    }
  }

  setupEventListeners() {
    // Modal controls
    document
      .getElementById("add-target-btn")
      .addEventListener("click", () => this.openAddModal());
    document
      .getElementById("bulk-upload-btn")
      .addEventListener("click", () => this.openBulkUploadModal());
    document
      .getElementById("logoutBtn")
      .addEventListener("click", () => this.logout());

    // Modal close buttons
    document
      .getElementById("close-add-modal-btn")
      .addEventListener("click", () => this.closeAddModal());
    document
      .getElementById("close-upload-modal-btn")
      .addEventListener("click", () => this.closeBulkUploadModal());
    document
      .getElementById("close-edit-modal-btn")
      .addEventListener("click", () => this.closeEditModal());
    document
      .getElementById("close-delete-modal-btn")
      .addEventListener("click", () => this.closeDeleteModal());

    // Modal cancel buttons
    document
      .getElementById("cancel-add-btn")
      .addEventListener("click", () => this.closeAddModal());
    document
      .getElementById("cancel-upload-btn")
      .addEventListener("click", () => this.closeBulkUploadModal());
    document
      .getElementById("cancel-edit-btn")
      .addEventListener("click", () => this.closeEditModal());
    document
      .getElementById("cancel-delete-btn")
      .addEventListener("click", () => this.closeDeleteModal());
    document
      .getElementById("confirm-delete-btn")
      .addEventListener("click", () => this.confirmDelete());

    // Form submissions
    document
      .getElementById("add-target-form")
      .addEventListener("submit", (e) => this.handleAddTarget(e));
    document
      .getElementById("edit-target-form")
      .addEventListener("submit", (e) => this.handleEditTarget(e));

    // File upload
    document
      .getElementById("file-upload")
      .addEventListener("change", (e) => this.handleFileUpload(e));

    // Add click handler to file upload area to allow re-uploading same file
    document
      .getElementById("file-upload-area")
      .addEventListener("click", () => this.handleFileUploadClick());
    document
      .getElementById("download-template-btn")
      .addEventListener("click", () => this.downloadTemplate());
    document
      .getElementById("validate-file-btn")
      .addEventListener("click", () => this.validateFile());

    document
      .getElementById("import-data-btn")
      .addEventListener("click", () => this.importData());

    // Search input filter
    document
      .getElementById("search-input")
      .addEventListener("input", () => this.applyFilters());

    // New modal interactions
    document
      .getElementById("modal-client-search")
      .addEventListener("input", (e) =>
        this.filterClientOptions(e.target.value)
      );
    document
      .getElementById("modal-client-search")
      .addEventListener("focus", () => this.showClientDropdown());
    // Removed blur event listener that was causing dropdown to hide immediately
    document
      .getElementById("modal-client-search")
      .addEventListener("click", () => this.showClientDropdown());

    // Modernized dropdown interactions
    document
      .getElementById("modal-tag-type")
      .addEventListener("click", () =>
        this.toggleDropdown("modal-tag-type-dropdown")
      );
    document
      .getElementById("modal-tag-name")
      .addEventListener("click", () =>
        this.toggleDropdown("modal-tag-name-dropdown")
      );
    document
      .getElementById("modal-channel")
      .addEventListener("click", () =>
        this.toggleDropdown("modal-channel-dropdown")
      );
    document
      .getElementById("modal-month")
      .addEventListener("click", () =>
        this.toggleDropdown("modal-month-dropdown")
      );

    // Main page dropdown interactions
    document
      .getElementById("client-select")
      .addEventListener("click", () => this.toggleDropdown("client-dropdown"));
    document
      .getElementById("month-select")
      .addEventListener("click", () => this.toggleDropdown("month-dropdown"));

    // Search functionality for main dropdowns
    document
      .getElementById("client-search")
      .addEventListener("input", (e) =>
        this.filterMainClientOptions(e.target.value)
      );
    document
      .getElementById("month-search")
      .addEventListener("input", (e) =>
        this.filterMainMonthOptions(e.target.value)
      );

    document
      .getElementById("add-enable-btn")
      .addEventListener("click", (e) => this.handleAddTargetWithForm(e, true));
  }

  async loadClients() {
    try {
      const response = await this.apiCall("/api/tags/clients");
      this.clients = response.clients;
      this.populateClientSelects();
    } catch (error) {
      console.error("Error loading clients:", error);
      // Add fallback options for client dropdowns
      const clientSelect = document.getElementById("client-select");
      if (clientSelect) {
        clientSelect.innerHTML =
          '<option value="all">All Clients</option><option value="">No clients available</option>';
      }
    }
  }

  async loadTargets() {
    try {
      const response = await this.apiCall("/api/targets");
      this.targets = response;
      this.renderTargets();
    } catch (error) {
      console.error("Error loading targets:", error);
    }
  }

  populateClientSelects() {
    const modalClientDropdown = document.getElementById(
      "modal-client-dropdown"
    );
    const clientOptions = document.getElementById("client-options");

    // Clear existing options
    modalClientDropdown.innerHTML = "";
    clientOptions.innerHTML =
      '<div class="px-3 py-2 hover:bg-slate-100 cursor-pointer text-sm" data-value="all">All Clients</div>';

    // Add client options
    this.clients.forEach((client) => {
      // For main filter dropdown
      const option1 = document.createElement("div");
      option1.className = "px-3 py-2 hover:bg-slate-100 cursor-pointer text-sm";
      option1.textContent = client.client_subgroup_name;
      option1.dataset.value = client.id;
      option1.addEventListener("click", () => {
        document.getElementById("client-select").value =
          client.client_subgroup_name;
        document.getElementById("client-dropdown").classList.add("hidden");
        this.applyFilters();
      });
      clientOptions.appendChild(option1);

      // For modal dropdown
      const option2 = document.createElement("div");
      option2.className = "px-3 py-2 hover:bg-slate-100 cursor-pointer text-sm";
      option2.textContent = client.client_subgroup_name;
      option2.dataset.clientId = client.id;
      option2.dataset.clientName = client.client_subgroup_name;

      option2.addEventListener("click", () => {
        this.selectClient(client.id, client.client_subgroup_name);
      });

      modalClientDropdown.appendChild(option2);
    });

    // Add click handler for "All Clients" option
    const allClientsOption = clientOptions.querySelector('[data-value="all"]');
    if (allClientsOption) {
      allClientsOption.addEventListener("click", () => {
        document.getElementById("client-select").value = "All Clients";
        document.getElementById("client-dropdown").classList.add("hidden");
        this.applyFilters();
      });
    }
  }

  resetMainFilters() {
    // Reset client filter to "All Clients"
    document.getElementById("client-select").value = "All Clients";
    document.getElementById("client-dropdown").classList.add("hidden");

    // Reset month filter to default
    this.resetMonthFilter();

    // Clear search input
    document.getElementById("search-input").value = "";

    // Apply filters to show all targets
    this.applyFilters();
  }

  resetMonthFilter() {
    // Reset month filter to default (August 2025)
    const defaultMonth = "August 2025";
    document.getElementById("month-select").value = defaultMonth;
    document.getElementById("month-dropdown").classList.add("hidden");
  }

  selectClient(clientId, clientName) {
    // Set the hidden input value
    document.getElementById("modal-client-select").value = clientId;

    // Update the search input with the selected client name
    document.getElementById("modal-client-search").value = clientName;

    // Hide the dropdown
    this.hideClientDropdown();

    // Enable tag type dropdown
    document.getElementById("modal-tag-type").disabled = false;

    // Clear tag dropdown and auto-populated fields
    document.getElementById("modal-tag-name").value = "";
    document.getElementById("modal-tag-name").disabled = true;
    this.clearAutoPopulatedFields();

    // Disable other inputs until tag type is selected
    document.getElementById("modal-channel").disabled = true;
    document.getElementById("modal-month").disabled = true;
    document.getElementById("modal-spends-target").disabled = true;
  }

  toggleDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    const allDropdowns = document.querySelectorAll('[id$="-dropdown"]');

    // Close all other dropdowns
    allDropdowns.forEach((dd) => {
      if (dd.id !== dropdownId) {
        dd.classList.add("hidden");
      }
    });

    // Toggle current dropdown
    dropdown.classList.toggle("hidden");
  }

  // Close dropdowns when clicking outside
  setupDropdownClickOutside() {
    document.addEventListener("click", (e) => {
      // Don't close if clicking on the search input or inside the dropdown
      if (
        !e.target.closest('[id$="-dropdown"]') &&
        !e.target.closest("input[readonly]") &&
        !e.target.closest("#modal-client-search")
      ) {
        const allDropdowns = document.querySelectorAll('[id$="-dropdown"]');
        allDropdowns.forEach((dd) => dd.classList.add("hidden"));
      }
    });
  }

  filterMainClientOptions(searchTerm) {
    const options = document.getElementById("client-options");
    const allOptions = options.querySelectorAll("[data-value]");

    allOptions.forEach((option) => {
      const text = option.textContent.toLowerCase();
      if (
        text.includes(searchTerm.toLowerCase()) ||
        option.dataset.value === "all"
      ) {
        option.style.display = "block";
      } else {
        option.style.display = "none";
      }
    });
  }

  filterMainMonthOptions(searchTerm) {
    const options = document.getElementById("month-options");
    const allOptions = options.querySelectorAll("[data-value]");

    allOptions.forEach((option) => {
      const text = option.textContent.toLowerCase();
      if (text.includes(searchTerm.toLowerCase())) {
        option.style.display = "block";
      } else {
        option.style.display = "none";
      }
    });
  }

  populateMonthOptions() {
    const monthOptions = document.getElementById("month-options");
    const modalMonthDropdown = document.getElementById("modal-month-dropdown");

    // Generate months for the next 2 years
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();

    // Clear existing options
    monthOptions.innerHTML = "";
    modalMonthDropdown.innerHTML = "";

    for (let year = currentYear - 1; year <= currentYear + 1; year++) {
      for (let month = 1; month <= 12; month++) {
        const monthName = new Date(year, month - 1).toLocaleDateString(
          "en-US",
          { month: "long", year: "numeric" }
        );
        const monthValue = `${year}-${month.toString().padStart(2, "0")}`;

        // For main month dropdown
        const option1 = document.createElement("div");
        option1.className =
          "px-3 py-2 hover:bg-slate-100 cursor-pointer text-sm";
        option1.textContent = monthName;
        option1.dataset.value = monthValue;
        option1.addEventListener("click", () => {
          document.getElementById("month-select").value = monthName;
          document.getElementById("month-dropdown").classList.add("hidden");
          this.applyFilters();
        });
        monthOptions.appendChild(option1);

        // For modal month dropdown
        const option2 = document.createElement("div");
        option2.className =
          "px-3 py-2 hover:bg-slate-100 cursor-pointer text-sm";
        option2.textContent = monthName;
        option2.dataset.value = monthValue;
        option2.addEventListener("click", () => {
          document.getElementById("modal-month").value = monthName;
          document
            .getElementById("modal-month-dropdown")
            .classList.add("hidden");
        });
        modalMonthDropdown.appendChild(option2);
      }
    }

    // Add "All Months" option at the beginning
    const allMonthsOption = document.createElement("div");
    allMonthsOption.className =
      "px-3 py-2 hover:bg-slate-100 cursor-pointer text-sm font-medium text-blue-600";
    allMonthsOption.textContent = "All Months";
    allMonthsOption.dataset.value = "all";
    allMonthsOption.addEventListener("click", () => {
      document.getElementById("month-select").value = "All Months";
      document.getElementById("month-dropdown").classList.add("hidden");
      this.applyFilters();
    });
    monthOptions.insertBefore(allMonthsOption, monthOptions.firstChild);

    // Set default month for main page filter (All Months)
    const defaultMonth = "All Months";
    document.getElementById("month-select").value = defaultMonth;
  }

  setupDropdownEventListeners() {
    // Add event listeners for tag type dropdown options
    const tagTypeOptions = document.querySelectorAll(
      "#modal-tag-type-dropdown [data-value]"
    );
    tagTypeOptions.forEach((option) => {
      option.addEventListener("click", (e) => {
        const tagType = e.target.dataset.value;
        this.selectTagType(tagType);
      });
    });

    // Add event listeners for channel dropdown options
    const channelOptions = document.querySelectorAll(
      "#modal-channel-dropdown [data-value]"
    );
    channelOptions.forEach((option) => {
      option.addEventListener("click", (e) => {
        const channel = e.target.dataset.value;
        this.selectChannel(channel);
      });
    });
  }

  onClientChange(clientSubgroupId) {
    if (clientSubgroupId && clientSubgroupId !== "") {
      // Enable tag type dropdown
      document.getElementById("modal-tag-type").disabled = false;

      // Update search input with selected client name
      const clientSelect = document.getElementById("modal-client-select");
      const selectedOption = clientSelect.options[clientSelect.selectedIndex];
      if (selectedOption && selectedOption.textContent) {
        document.getElementById("modal-client-search").value =
          selectedOption.textContent;
      }

      // Clear tag dropdown and auto-populated fields
      document.getElementById("modal-tag-name").value = "";
      document.getElementById("modal-tag-name").disabled = true;
      delete document.getElementById("modal-tag-name").dataset.tagId;
      delete document.getElementById("modal-tag-name").dataset.completeTagData;
      this.clearAutoPopulatedFields();
      // Don't disable tag type since we just enabled it
      document.getElementById("modal-channel").disabled = true;
      document.getElementById("modal-month").disabled = true;
      document.getElementById("modal-spends-target").disabled = true;
    } else {
      // Clear tag type and tag name dropdowns
      document.getElementById("modal-tag-type").value = "";
      document.getElementById("modal-tag-type").disabled = true;
      document.getElementById("modal-tag-name").value = "";
      document.getElementById("modal-tag-name").disabled = true;
      delete document.getElementById("modal-tag-name").dataset.tagId;
      delete document.getElementById("modal-tag-name").dataset.completeTagData;
      this.clearAutoPopulatedFields();
      this.disableOtherInputs();
    }
  }

  onTagTypeChange(tagType) {
    if (tagType && tagType !== "") {
      const clientSubgroupId = document.getElementById(
        "modal-client-select"
      ).value;
      if (clientSubgroupId && clientSubgroupId !== "") {
        this.loadTagsForSubgroupWithType(clientSubgroupId, tagType);
        // Enable tag name dropdown
        document.getElementById("modal-tag-name").disabled = false;
      }
    } else {
      // Clear tag dropdown and auto-populated fields
      document.getElementById("modal-tag-name").value = "";
      document.getElementById("modal-tag-name").disabled = true;
      delete document.getElementById("modal-tag-name").dataset.tagId;
      delete document.getElementById("modal-tag-name").dataset.completeTagData;
      this.clearAutoPopulatedFields();
      this.disableOtherInputs();
    }
  }

  selectTagType(tagType) {
    document.getElementById("modal-tag-type").value = tagType;
    document.getElementById("modal-tag-type-dropdown").classList.add("hidden");
    this.onTagTypeChange(tagType);
  }

  selectChannel(channel) {
    document.getElementById("modal-channel").value = channel;
    document.getElementById("modal-channel-dropdown").classList.add("hidden");
  }

  async loadTagsForSubgroup(subgroupId) {
    try {
      const response = await this.apiCall(`/api/tags/client/${subgroupId}`);
      this.populateTagDropdown(response.tags);
      document.getElementById("modal-tag-name").disabled = false;
    } catch (error) {
      console.error("Error loading tags:", error);
      document.getElementById("modal-tag-name").value = "Error loading tags";
      document.getElementById("modal-tag-name").disabled = true;
    }
  }

  async loadTagsForSubgroupWithType(subgroupId, tagType) {
    try {
      const response = await this.apiCall(
        `/api/tags/filtered/${subgroupId}?tagType=${encodeURIComponent(
          tagType
        )}`
      );
      this.populateTagDropdown(response);
      document.getElementById("modal-tag-name").disabled = false;
    } catch (error) {
      console.error("Error loading filtered tags:", error);
      document.getElementById("modal-tag-name").value = "Error loading tags";
      document.getElementById("modal-tag-name").disabled = true;
    }
  }

  populateTagDropdown(tags) {
    const tagDropdown = document.getElementById("modal-tag-name-dropdown");
    tagDropdown.innerHTML =
      '<div class="px-3 py-2 text-sm text-slate-400">Select a tag...</div>';

    tags.forEach((tag) => {
      const option = document.createElement("div");
      option.className = "px-3 py-2 hover:bg-slate-100 cursor-pointer text-sm";
      option.textContent = tag.tag_name;
      option.dataset.tagData = JSON.stringify(tag);
      option.addEventListener("click", () => {
        document.getElementById("modal-tag-name").value = tag.tag_name;
        document.getElementById("modal-tag-name").dataset.tagId = tag.tag_id;
        document
          .getElementById("modal-tag-name-dropdown")
          .classList.add("hidden");
        this.onTagNameChange(tag);
      });
      tagDropdown.appendChild(option);
    });
  }

  onTagNameChange(tagData) {
    if (tagData) {
      // Store the complete tag data for later use
      document.getElementById("modal-tag-name").dataset.completeTagData =
        JSON.stringify(tagData);
      this.populateAutoFields(tagData);
      // Enable other inputs
      this.enableOtherInputs();
    } else {
      this.clearAutoPopulatedFields();
      // Disable other inputs
      this.disableOtherInputs();
    }
  }

  disableOtherInputs() {
    document.getElementById("modal-tag-type").disabled = true;
    document.getElementById("modal-tag-name").disabled = true;
    document.getElementById("modal-channel").disabled = true;
    document.getElementById("modal-month").disabled = true;
    document.getElementById("modal-spends-target").disabled = true;
  }

  enableOtherInputs() {
    document.getElementById("modal-channel").disabled = false;
    document.getElementById("modal-month").disabled = false;
    document.getElementById("modal-spends-target").disabled = false;
  }

  filterClientOptions(searchTerm) {
    const clientDropdown = document.getElementById("modal-client-dropdown");
    const searchInput = document.getElementById("modal-client-search");

    // Clear search input
    if (searchInput) {
      searchInput.value = searchTerm;
    }

    // Filter options in the dropdown
    const options = clientDropdown.children;
    for (let i = 0; i < options.length; i++) {
      const option = options[i];
      const clientName = option.textContent.toLowerCase();
      const matches = clientName.includes(searchTerm.toLowerCase());

      if (matches) {
        option.style.display = "";
      } else {
        option.style.display = "none";
      }
    }

    // If search is empty, show all options
    if (!searchTerm.trim()) {
      for (let i = 0; i < options.length; i++) {
        const option = options[i];
        option.style.display = "";
      }
    }
  }

  showClientDropdown() {
    const clientDropdown = document.getElementById("modal-client-dropdown");
    if (clientDropdown) {
      clientDropdown.classList.remove("hidden");
      // Show all options when dropdown is opened
      this.filterClientOptions("");
    }
  }

  hideClientDropdown() {
    const clientDropdown = document.getElementById("modal-client-dropdown");
    if (clientDropdown) {
      clientDropdown.classList.add("hidden");
    }
  }

  populateAutoFields(tagData) {
    // Get the selected client name from the clients array
    const clientSubgroupId = document.getElementById(
      "modal-client-select"
    ).value;
    const client = this.clients.find((c) => c.id == clientSubgroupId);
    const clientName = client
      ? client.client_subgroup_name
      : `Client ${tagData.client_subgroup_id}`;

    document.getElementById("auto-client-name").textContent = clientName;
    document.getElementById("auto-tag-type").textContent = tagData.tag_header;
    document.getElementById("auto-tag-id").textContent = tagData.tag_id;
  }

  clearAutoPopulatedFields() {
    document.getElementById("auto-client-name").textContent = "-";
    document.getElementById("auto-tag-type").textContent = "-";
    document.getElementById("auto-tag-id").textContent = "-";

    // Reset tag type dropdown
    const tagTypeInput = document.getElementById("modal-tag-type");
    if (tagTypeInput) {
      tagTypeInput.value = "";
    }

    // Clear tag name data
    const tagNameInput = document.getElementById("modal-tag-name");
    if (tagNameInput) {
      delete tagNameInput.dataset.tagId;
      delete tagNameInput.dataset.completeTagData;
    }
  }

  renderTargets() {
    const tbody = document.getElementById("pacing-table-body");
    tbody.innerHTML = "";

    if (this.targets.length === 0) {
      tbody.innerHTML = `
                <tr>
                    <td colspan="12" class="px-6 py-4 text-center text-slate-500">
                        No pacing targets found. Create your first target or upload a CSV file.
                    </td>
                </tr>
            `;
      return;
    }

    this.targets.forEach((target) => {
      const row = this.createTargetRow(target);
      tbody.appendChild(row);
    });
  }

  createTargetRow(target) {
    const row = document.createElement("tr");
    row.className = "bg-white border-b hover:bg-slate-50";
    row.innerHTML = `
            <td class="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">${
              target.clientName
            }</td>
            <td class="px-6 py-4 text-center">${target.clientSubgroupId}</td>
            <td class="px-6 py-4">${target.tagName}</td>
            <td class="px-6 py-4 text-center">${target.channel}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="bg-${
                  target.tagType === "Category"
                    ? "blue"
                    : target.tagType === "Sub Category"
                    ? "green"
                    : "purple"
                }-100 text-${
      target.tagType === "Category"
        ? "blue"
        : target.tagType === "Sub Category"
        ? "green"
        : "purple"
    }-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    ${target.tagType}
                </span>
            </td>
            <td class="px-6 py-4 font-mono">${target.tagId}</td>
            <td class="px-6 py-4">${this.formatMonth(target.month)}</td>
            <td class="px-6 py-4 text-right font-mono">${this.formatCurrency(
              target.spendsTarget
            )}</td>
            <td class="px-6 py-4 whitespace-nowrap">${this.formatDateTime(
              target.lastModified
            )}</td>
            <td class="px-6 py-4">${
              target.modifiedBy?.username || "Unknown"
            }</td>
            <td class="px-6 py-4 text-center">
                <div class="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input type="checkbox" name="toggle${
                      target._id
                    }" id="toggle${target._id}" 
                           class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" 
                           ${target.status ? "checked" : ""}>
                    <label for="toggle${
                      target._id
                    }" class="toggle-label block overflow-hidden h-6 rounded-full bg-slate-300 cursor-pointer"></label>
                </div>
            </td>
            <td class="px-6 py-4 text-center whitespace-nowrap">
                <a href="#" class="font-medium text-blue-600 hover:underline edit-btn" data-id="${
                  target._id
                }">Edit</a>
                <span class="mx-1 text-slate-300">|</span>
                <a href="#" class="font-medium text-red-600 hover:underline delete-btn" data-id="${
                  target._id
                }">Delete</a>
            </td>
        `;

    // Add event listeners
    const toggleCheckbox = row.querySelector(`#toggle${target._id}`);
    toggleCheckbox.addEventListener("change", () =>
      this.toggleTargetStatus(target._id)
    );

    const editBtn = row.querySelector(".edit-btn");
    editBtn.addEventListener("click", (e) => {
      e.preventDefault();
      this.openEditModal(target);
    });

    const deleteBtn = row.querySelector(".delete-btn");
    deleteBtn.addEventListener("click", (e) => {
      e.preventDefault();
      this.deleteTarget(target._id);
    });

    return row;
  }

  async toggleTargetStatus(targetId) {
    try {
      await this.apiCall(`/api/targets/${targetId}/toggle-status`, "PATCH");
      await this.loadTargets(); // Reload to get updated data
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  }

  async deleteTarget(targetId) {
    // Store the target ID for deletion confirmation
    this.targetToDelete = targetId;

    // Find the target data to display in confirmation modal
    const target = this.targets.find((t) => t._id === targetId);
    if (target) {
      document.getElementById("delete-client-name").textContent =
        target.clientName;
      document.getElementById("delete-tag-name").textContent = target.tagName;
      document.getElementById("delete-month").textContent = this.formatMonth(
        target.month
      );
    }

    // Show delete confirmation modal
    document
      .getElementById("delete-confirmation-modal")
      .classList.remove("modal-hidden");
  }

  async confirmDelete() {
    if (!this.targetToDelete) return;

    try {
      await this.apiCall(`/api/targets/${this.targetToDelete}`, "DELETE");
      this.closeDeleteModal();
      await this.loadTargets(); // Reload to get updated data
    } catch (error) {
      console.error("Error deleting target:", error);
    }
  }

  closeDeleteModal() {
    document
      .getElementById("delete-confirmation-modal")
      .classList.add("modal-hidden");
    this.targetToDelete = null;
  }

  openAddModal() {
    const addModal = document.getElementById("add-target-modal");
    addModal.classList.remove("modal-hidden");
    document.getElementById("add-target-form").reset();

    // Reset search input and hidden input
    document.getElementById("modal-client-search").value = "";
    document.getElementById("modal-client-select").value = "";

    // Reset tag dropdown and auto-populated fields
    document.getElementById("modal-tag-name").value = "";
    document.getElementById("modal-tag-name").disabled = true;
    delete document.getElementById("modal-tag-name").dataset.tagId;
    delete document.getElementById("modal-tag-name").dataset.completeTagData;
    this.clearAutoPopulatedFields();

    // Hide any error messages
    this.hideError();

    // Disable all inputs except client selection
    this.disableOtherInputs();

    // Show all client options
    this.filterClientOptions("");

    // Reset month to default
    this.resetModalMonthFilter();

    // Add click outside to close functionality
    const handleClickOutside = (event) => {
      if (event.target === addModal) {
        this.closeAddModal();
        addModal.removeEventListener("click", handleClickOutside);
      }
    };

    addModal.addEventListener("click", handleClickOutside);

    // Store the handler for cleanup
    this.addModalClickHandler = handleClickOutside;
  }

  resetModalMonthFilter() {
    // Reset modal month to default (August 2025)
    const defaultMonth = "August 2025";
    document.getElementById("modal-month").value = defaultMonth;
  }

  closeAddModal() {
    const addModal = document.getElementById("add-target-modal");
    addModal.classList.add("modal-hidden");

    // Clean up event listener
    if (this.addModalClickHandler) {
      addModal.removeEventListener("click", this.addModalClickHandler);
      this.addModalClickHandler = null;
    }

    // Reset month filter to default
    this.resetModalMonthFilter();
  }

  openBulkUploadModal() {
    document
      .getElementById("bulk-upload-modal")
      .classList.remove("modal-hidden");

    // Reset UI state
    document.getElementById("validation-step").classList.remove("hidden");
    document.getElementById("validation-results").classList.add("hidden");
    document.getElementById("validation-progress").classList.add("hidden");

    // Reset import button state
    const importBtn = document.getElementById("import-data-btn");
    importBtn.disabled = true;
    importBtn.textContent = "Import Data";

    // Clear previous content
    document.getElementById("validation-content").innerHTML = "";
    document.getElementById("file-info-section").innerHTML = "";

    // Reset file input
    const fileInput = document.getElementById("file-upload");
    fileInput.value = "";
    this.uploadedFile = null;

    // Disable validate button
    const validateBtn = document.getElementById("validate-file-btn");
    if (validateBtn) {
      validateBtn.disabled = true;
    }
  }

  closeBulkUploadModal() {
    const uploadModal = document.getElementById("bulk-upload-modal");
    uploadModal.classList.add("modal-hidden");

    // Clean up event listener
    if (this.uploadModalClickHandler) {
      uploadModal.removeEventListener("click", this.uploadModalClickHandler);
      this.uploadModalClickHandler = null;
    }
  }

  openEditModal(target) {
    this.currentEditingTarget = target;
    const editModal = document.getElementById("edit-target-modal");
    editModal.classList.remove("modal-hidden");

    // Clear any previous error messages
    this.hideEditError();

    // Update modal content
    document.getElementById("edit-client-name").textContent = target.clientName;
    document.getElementById("edit-record-name").textContent = target.tagName;
    document.getElementById("edit-channel").textContent = target.channel;
    document.getElementById("edit-month").textContent = target.month;
    document.getElementById("edit-spends-target").value = target.spendsTarget;

    // Add click outside to close functionality
    const handleClickOutside = (event) => {
      if (event.target === editModal) {
        this.closeEditModal();
        editModal.removeEventListener("click", handleClickOutside);
      }
    };

    editModal.addEventListener("click", handleClickOutside);

    // Store the handler for cleanup
    this.editModalClickHandler = handleClickOutside;
  }

  closeEditModal() {
    const editModal = document.getElementById("edit-target-modal");
    editModal.classList.add("modal-hidden");

    // Clean up event listener
    if (this.editModalClickHandler) {
      editModal.removeEventListener("click", this.editModalClickHandler);
      this.editModalClickHandler = null;
    }

    this.currentEditingTarget = null;
  }

  async handleAddTarget(e, enableTarget = false) {
    e.preventDefault();

    // Temporarily enable all form fields to get their values
    const channelSelect = document.getElementById("modal-channel");
    const monthInput = document.getElementById("modal-month");
    const spendsInput = document.getElementById("modal-spends-target");

    const channelWasDisabled = channelSelect.disabled;
    const monthWasDisabled = monthInput.disabled;
    const spendsWasDisabled = spendsInput.disabled;

    // Enable fields temporarily
    channelSelect.disabled = false;
    monthInput.disabled = false;
    spendsInput.disabled = false;

    const formData = new FormData(e.target);
    const tagNameInput = document.getElementById("modal-tag-name");
    const clientSelect = document.getElementById("modal-client-select");

    if (!tagNameInput.value || tagNameInput.value === "") {
      this.showError("Please select a valid tag first.");
      // Restore the original disabled state
      channelSelect.disabled = channelWasDisabled;
      monthInput.disabled = monthWasDisabled;
      spendsInput.disabled = spendsWasDisabled;
      return;
    }

    if (!clientSelect.value || clientSelect.value === "") {
      this.showError("Please select a client first.");
      // Restore the original disabled state
      channelSelect.disabled = channelWasDisabled;
      monthInput.disabled = monthWasDisabled;
      spendsInput.disabled = spendsWasDisabled;
      return;
    }

    // Get tag data from the tag name input value
    const tagNameText = tagNameInput.value;

    if (!tagNameText || tagNameText === "") {
      this.showError("Please select a valid tag first.");
      // Restore the original disabled state
      channelSelect.disabled = channelWasDisabled;
      monthInput.disabled = monthWasDisabled;
      spendsInput.disabled = spendsWasDisabled;
      return;
    }

    // Get tag data from the dataset
    const tagId = tagNameInput.dataset.tagId;
    if (!tagId) {
      this.showError("Invalid tag data. Please select a tag again.");
      // Restore the original disabled state
      channelSelect.disabled = channelWasDisabled;
      monthInput.disabled = monthWasDisabled;
      spendsInput.disabled = spendsWasDisabled;
      return;
    }

    // Get the complete tag data from the dataset
    const completeTagData = tagNameInput.dataset.completeTagData;
    if (!completeTagData) {
      this.showError("Invalid tag data. Please select a tag again.");
      // Restore the original disabled state
      channelSelect.disabled = channelWasDisabled;
      monthInput.disabled = monthWasDisabled;
      spendsInput.disabled = spendsWasDisabled;
      return;
    }

    const tagData = JSON.parse(completeTagData);
    const spendsTarget = parseFloat(formData.get("modal-spends-target"));
    const channel = parseInt(formData.get("modal-channel"));
    const month = formData.get("modal-month");

    // Validate spends target
    if (spendsTarget < 0 || isNaN(spendsTarget)) {
      this.showError("Spends Target must be a non-negative number (>= 0).");
      // Restore the original disabled state
      channelSelect.disabled = channelWasDisabled;
      monthInput.disabled = monthWasDisabled;
      spendsInput.disabled = spendsWasDisabled;
      return;
    }

    // Validate channel
    if (!channel || isNaN(channel)) {
      this.showError("Please select a valid channel.");
      // Restore the original disabled state
      channelSelect.disabled = channelWasDisabled;
      monthInput.disabled = monthWasDisabled;
      spendsInput.disabled = spendsWasDisabled;
      return;
    }

    // Validate month
    if (!month) {
      this.showError("Please select a valid month.");
      // Restore the original disabled state
      channelSelect.disabled = channelWasDisabled;
      monthInput.disabled = monthWasDisabled;
      spendsInput.disabled = spendsWasDisabled;
      return;
    }

    // Convert month display format to YYYY-MM format
    let monthValue = month;
    if (month && month !== "Select month...") {
      const monthMatch = month.match(/^(.+?) (\d{4})$/);
      if (monthMatch) {
        const monthName = monthMatch[1];
        const year = monthMatch[2];
        const monthNum = new Date(`${monthName} 1, ${year}`).getMonth() + 1;
        monthValue = `${year}-${monthNum.toString().padStart(2, "0")}`;
      }
    }

    const targetData = {
      clientName: document.getElementById("modal-client-search").value,
      clientSubgroupId: parseInt(clientSelect.value),
      tagName: tagData.tag_name,
      channel: channel,
      tagType: tagData.tag_header,
      tagId: parseInt(tagNameInput.dataset.tagId || "0"),
      month: monthValue,
      spendsTarget: spendsTarget,
      status: enableTarget, // Set status based on which button was clicked
    };

    try {
      await this.apiCall("/api/targets", "POST", targetData);
      this.closeAddModal();
      await this.loadTargets();
      this.hideError();
    } catch (error) {
      console.error("Error creating target:", error);
      this.showError("Error creating target. Please try again.");
    } finally {
      // Restore the original disabled state
      channelSelect.disabled = channelWasDisabled;
      monthInput.disabled = monthWasDisabled;
      spendsInput.disabled = spendsWasDisabled;
    }
  }

  async handleAddTargetWithForm(e, enableTarget = false) {
    e.preventDefault();

    // Get the form element and create a proper submit event
    const form = document.getElementById("add-target-form");

    // Create a synthetic submit event
    const submitEvent = new Event("submit", {
      bubbles: true,
      cancelable: true,
    });

    // Set the target to the form element
    Object.defineProperty(submitEvent, "target", {
      value: form,
      writable: false,
    });

    // Call the original method with the synthetic event
    await this.handleAddTarget(submitEvent, enableTarget);
  }

  showError(message) {
    const errorDiv = document.getElementById("error-message");
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.classList.remove("hidden");
    } else {
      // Fallback to alert if error div doesn't exist
      console.error("Error div not found, falling back to alert:", message);
      alert(message);
    }
  }

  hideError() {
    const errorDiv = document.getElementById("error-message");
    if (errorDiv) {
      errorDiv.classList.add("hidden");
    }
  }

  showEditError(message) {
    const errorDiv = document.getElementById("edit-error-message");
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.classList.remove("hidden");
    } else {
      // Fallback to alert if error div doesn't exist
      console.error(
        "Edit error div not found, falling back to alert:",
        message
      );
      alert(message);
    }
  }

  hideEditError() {
    const errorDiv = document.getElementById("edit-error-message");
    if (errorDiv) {
      errorDiv.classList.add("hidden");
    }
  }

  async handleEditTarget(e) {
    e.preventDefault();

    if (!this.currentEditingTarget) return;

    const spendsTarget = parseFloat(
      document.getElementById("edit-spends-target").value
    );

    // Validate spends target
    if (spendsTarget < 0 || isNaN(spendsTarget)) {
      this.showEditError("Spends Target must be a non-negative number (>= 0).");
      return;
    }

    try {
      await this.apiCall(
        `/api/targets/${this.currentEditingTarget._id}`,
        "PUT",
        { spendsTarget }
      );
      this.closeEditModal();
      await this.loadTargets();
    } catch (error) {
      console.error("Error updating target:", error);
      this.showEditError("Error updating target. Please try again.");
    }
  }

  handleFileUploadClick() {
    const fileInput = document.getElementById("file-upload");
    fileInput.value = "";
    this.uploadedFile = null;
    document.getElementById("validation-results").classList.add("hidden");
    document.getElementById("validation-step").classList.remove("hidden");

    // Reset import button state
    const importBtn = document.getElementById("import-data-btn");
    importBtn.disabled = true;
    importBtn.textContent = "Import Data";

    document.getElementById("validation-content").innerHTML = "";
    document.getElementById("file-info-section").innerHTML = "";
    const validateBtn = document.getElementById("validate-file-btn");
    if (validateBtn) {
      validateBtn.disabled = true;
    }
  }

  handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    this.uploadedFile = file;

    // Always show validation step, hide results, clear content, and disable import button
    document.getElementById("validation-step").classList.remove("hidden");
    document.getElementById("validation-results").classList.add("hidden");
    document.getElementById("validation-content").innerHTML = "";
    document.getElementById("file-info-section").innerHTML = "";

    // Reset import button state
    const importBtn = document.getElementById("import-data-btn");
    importBtn.disabled = true;
    importBtn.textContent = "Import Data";

    // Show file info
    document.getElementById("file-info-section").innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <svg class="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd" />
          </svg>
          <div>
            <p class="text-sm font-medium text-blue-900">${file.name}</p>
            <p class="text-sm text-blue-500">${(file.size / 1024).toFixed(
              1
            )} KB</p>
          </div>
        </div>
        <button
          type="button"
          onclick="this.parentElement.remove()"
          class="text-blue-400 hover:text-blue-600"
        >
          <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    `;

    // Enable validate button
    const validateBtn = document.getElementById("validate-file-btn");
    if (validateBtn) {
      validateBtn.disabled = false;
    }
  }

  async downloadTemplate() {
    try {
      const response = await this.apiCall(
        "/api/upload/template",
        "GET",
        null,
        true
      );
      const blob = new Blob([response], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "pacing-targets-template.csv";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading template:", error);
    }
  }

  async validateFile() {
    if (!this.uploadedFile) return;

    // Show progress UI
    document.getElementById("validation-progress").classList.remove("hidden");
    document.getElementById("validation-step").classList.add("hidden");

    // Set progress title for validation
    document.querySelector("#validation-progress h4").textContent =
      "Validating CSV File...";

    // Simulate progress updates
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress > 90) progress = 90;

      document.getElementById("progress-bar").style.width = `${progress}%`;
      document.getElementById(
        "progress-percentage"
      ).textContent = `${Math.round(progress)}%`;

      if (progress < 30) {
        document.getElementById("progress-text").textContent =
          "Reading CSV file...";
      } else if (progress < 60) {
        document.getElementById("progress-text").textContent =
          "Validating data...";
      } else if (progress < 90) {
        document.getElementById("progress-text").textContent =
          "Cross-checking with database...";
      }
    }, 200);

    const formData = new FormData();
    formData.append("file", this.uploadedFile);

    try {
      const response = await fetch("/api/upload/validate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);

      // Complete progress
      document.getElementById("progress-bar").style.width = "100%";
      document.getElementById("progress-percentage").textContent = "100%";
      document.getElementById("progress-text").textContent =
        "Validation complete!";

      const result = await response.json();

      // Hide progress UI
      setTimeout(() => {
        document.getElementById("validation-progress").classList.add("hidden");
      }, 500);

      // Always show validation results regardless of success/failure
      document.getElementById("validation-results").classList.remove("hidden");

      if (response.ok) {
        if (result.canImport) {
          document.getElementById("validation-content").innerHTML = `
            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
              <div class="flex">
                <svg class="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <div class="ml-3">
                  <p class="text-sm font-medium text-green-800">${result.message}</p>
                  <div class="mt-2 text-sm text-green-700">
                    <p>Total rows: ${result.totalRows}</p>
                    <p>Valid rows: ${result.validRows}</p>
                    <p>Empty rows: ${result.emptyRows}</p>
                    <p class="text-xs text-green-600 mt-1">✓ No duplicates found in CSV file</p>
                    <p class="text-xs text-green-600">✓ No conflicts with existing database entries</p>
                  </div>
                </div>
              </div>
            </div>
          `;

          // Enable import button
          document.getElementById("import-data-btn").disabled = false;
        } else {
          // Show validation results without clearing file info
          let validationHtml = `
            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
              <div class="flex">
                <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
                <div class="ml-3">
                  <p class="text-sm font-medium text-red-800">${result.message}</p>
                  <div class="mt-2 text-sm text-red-700">
                    <p>Total rows: ${result.totalRows}</p>
                    <p>Valid rows: ${result.validRows}</p>
                    <p>Error rows: ${result.errorRows}</p>
                    <p>Empty rows: ${result.emptyRows}</p>
                    <p class="text-xs text-red-600 mt-1">⚠ Please fix the errors below before importing</p>
                  </div>
                </div>
              </div>
            </div>
          `;

          // Show detailed errors if available
          if (result.errors && result.errors.length > 0) {
            let errorHtml = `<div class="mt-3 space-y-2 max-h-96 overflow-y-auto">`;
            result.errors.forEach((error, index) => {
              errorHtml += `
                <div class="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p class="text-sm font-medium text-red-800">Row ${
                    error.row
                  }: ${error.error}</p>
                  <p class="text-sm text-red-700 mt-1">${
                    error.details || ""
                  }</p>
                  <p class="text-xs text-red-600 mt-2 font-mono break-all">${JSON.stringify(
                    error.data
                  )}</p>
                </div>
              `;
            });
            errorHtml += `</div>`;
            validationHtml += errorHtml;
          }

          // Now set the complete validation content
          document.getElementById("validation-content").innerHTML =
            validationHtml;

          // Keep import button disabled
          document.getElementById("import-data-btn").disabled = true;
        }
      } else {
        // Show validation results for failed validation (400 status)

        let validationHtml = `
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <div class="flex">
              <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
              <div class="ml-3">
                <p class="text-sm font-medium text-red-800">${result.message}</p>
                <div class="mt-2 text-sm text-red-700">
                  <p>Total rows: ${result.totalRows}</p>
                  <p>Valid rows: ${result.validRows}</p>
                  <p>Error rows: ${result.errorRows}</p>
                  <p>Empty rows: ${result.emptyRows}</p>
                </div>
              </div>
            </div>
          </div>
        `;

        // Show detailed errors if available
        if (result.errors && result.errors.length > 0) {
          let errorHtml = `<div class="mt-3 space-y-2 max-h-96 overflow-y-auto">`;
          result.errors.forEach((error, index) => {
            errorHtml += `
              <div class="bg-red-50 border border-red-200 rounded-lg p-3">
                <p class="text-sm font-medium text-red-800">Row ${error.row}: ${
              error.error
            }</p>
                <p class="text-sm text-red-700 mt-1">${error.details || ""}</p>
                <p class="text-xs text-red-600 mt-2 font-mono break-all">${JSON.stringify(
                  error.data
                )}</p>
              </div>
            `;
          });
          errorHtml += `</div>`;
          validationHtml += errorHtml;
        }

        // Set the complete validation content
        document.getElementById("validation-content").innerHTML =
          validationHtml;
        document.getElementById("import-data-btn").disabled = true;

        // Don't reset file input here - let user see the errors and re-upload if needed
      }
    } catch (error) {
      clearInterval(progressInterval);
      document.getElementById("validation-progress").classList.add("hidden");

      console.error("Error validating file:", error);

      // Show validation results for network errors
      document.getElementById("validation-content").innerHTML = `
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <p class="text-sm text-red-800">Network error. Please try again.</p>
        </div>
      `;
      document.getElementById("import-data-btn").disabled = true;

      // Reset file input to allow re-uploading
      this.resetFileInput();
    }
  }

  async importData() {
    if (!this.uploadedFile) return;

    // Disable import button to prevent duplicate requests
    const importBtn = document.getElementById("import-data-btn");
    importBtn.disabled = true;
    importBtn.textContent = "Importing...";

    // Show progress UI
    document.getElementById("validation-progress").classList.remove("hidden");
    document.getElementById("validation-results").classList.add("hidden");

    // Set progress title for import
    document.querySelector("#validation-progress h4").textContent =
      "Importing CSV File...";

    // Simulate progress updates
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress > 90) progress = 90;

      document.getElementById("progress-bar").style.width = `${progress}%`;
      document.getElementById(
        "progress-percentage"
      ).textContent = `${Math.round(progress)}%`;

      if (progress < 30) {
        document.getElementById("progress-text").textContent =
          "Preparing data for import...";
      } else if (progress < 60) {
        document.getElementById("progress-text").textContent =
          "Importing data to database...";
      } else if (progress < 90) {
        document.getElementById("progress-text").textContent =
          "Finalizing import...";
      }
    }, 300);

    const formData = new FormData();
    formData.append("file", this.uploadedFile);

    try {
      const response = await fetch("/api/upload/csv", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);

      // Complete progress
      document.getElementById("progress-bar").style.width = "100%";
      document.getElementById("progress-percentage").textContent = "100%";
      document.getElementById("progress-text").textContent = "Import complete!";

      const result = await response.json();

      // Hide progress UI
      setTimeout(() => {
        document.getElementById("validation-progress").classList.add("hidden");
      }, 500);

      // Always show validation results regardless of success/failure
      document.getElementById("validation-results").classList.remove("hidden");

      if (response.ok) {
        document.getElementById("validation-content").innerHTML = `
          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <div class="flex">
              <svg class="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <div class="ml-3">
                <p class="text-sm font-medium text-green-800">Import completed successfully!</p>
                <div class="mt-2 text-sm text-green-700">
                  <p>Total rows: ${result.totalRows || "N/A"}</p>
                  <p>Valid rows: ${result.validRows || "N/A"}</p>
                  <p>Imported rows: ${
                    result.importedRows || result.validRows || "N/A"
                  }</p>
                </div>
              </div>
            </div>
          </div>
        `;

        // Reload targets
        await this.loadTargets();

        // Keep import button disabled after successful import
        importBtn.disabled = true;
        importBtn.textContent = "Import Data";
      } else {
        let errorHtml = `
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <div class="flex">
              <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
              <div class="ml-3">
                <p class="text-sm font-medium text-red-800">Import failed: ${result.message}</p>
              </div>
            </div>
          </div>
        `;

        // Display detailed validation errors if available
        if (result.errors && result.errors.length > 0) {
          errorHtml += `<div class="mt-3 space-y-2 max-h-96 overflow-y-auto">`;
          result.errors.forEach((error, index) => {
            errorHtml += `
               <div class="bg-red-50 border border-red-200 rounded-lg p-3">
                 <p class="text-sm font-medium text-red-800">Row ${
                   error.row
                 }: ${error.error}</p>
                 <p class="text-sm text-red-700 mt-1">${error.details || ""}</p>
                 <p class="text-xs text-red-600 mt-2 font-mono break-all">${JSON.stringify(
                   error.data
                 )}</p>
               </div>
             `;
          });
          errorHtml += `</div>`;
        }

        document.getElementById("validation-content").innerHTML = errorHtml;

        // Reset file input on validation errors so user can try a different file
        this.resetFileInput();
        importBtn.disabled = true;
        importBtn.textContent = "Import Data";
      }
    } catch (error) {
      console.error("Error importing data:", error);

      clearInterval(progressInterval);

      // Hide progress UI
      document.getElementById("validation-progress").classList.add("hidden");
      document.getElementById("validation-results").classList.remove("hidden");

      document.getElementById("validation-content").innerHTML = `
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <div class="flex">
            <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            <div class="ml-3">
              <p class="text-sm font-medium text-red-800">Network error. Please try again.</p>
            </div>
          </div>
        </div>
      `;

      // Reset file input and uploaded file on network error
      this.resetFileInput();
      importBtn.disabled = true;
      importBtn.textContent = "Import Data";
    }
  }

  resetFileInput() {
    // Reset file input to allow re-uploading the same file
    const fileInput = document.getElementById("file-upload");
    fileInput.value = "";
    this.uploadedFile = null;

    // Keep validation step visible and hide other UI elements
    document.getElementById("validation-step").classList.remove("hidden");
    document.getElementById("validation-results").classList.add("hidden");
    document.getElementById("validation-progress").classList.add("hidden");

    // Clear file info and validation content
    document.getElementById("file-info-section").innerHTML = "";
    document.getElementById("validation-content").innerHTML = "";

    // Reset import button state
    const importBtn = document.getElementById("import-data-btn");
    importBtn.disabled = true;
    importBtn.textContent = "Import Data";

    // Disable validate button when no file is selected
    const validateBtn = document.getElementById("validate-file-btn");
    if (validateBtn) {
      validateBtn.disabled = true;
    }
  }

  applyFilters() {
    const monthInput = document.getElementById("month-select");
    const clientInput = document.getElementById("client-select");
    const search = document.getElementById("search-input").value;

    let filteredTargets = this.targets;

    // Extract month value from display text (e.g., "August 2025" -> "2025-08")
    if (monthInput.value && monthInput.value !== "All Months") {
      const monthMatch = monthInput.value.match(/^(.+?) (\d{4})$/);
      if (monthMatch) {
        const monthName = monthMatch[1];
        const year = monthMatch[2];
        const monthNum = new Date(`${monthName} 1, ${year}`).getMonth() + 1;
        const monthValue = `${year}-${monthNum.toString().padStart(2, "0")}`;

        filteredTargets = filteredTargets.filter(
          (target) => target.month === monthValue
        );
      }
    }

    // Extract client ID from display text
    if (clientInput.value && clientInput.value !== "All Clients") {
      // Find the client by name in the clients array
      const selectedClient = this.clients.find(
        (c) => c.client_subgroup_name === clientInput.value
      );
      if (selectedClient) {
        filteredTargets = filteredTargets.filter(
          (target) => target.clientSubgroupId == selectedClient.id
        );
      }
    }
    // If "All Clients" is selected, no filtering is applied (filteredTargets remains as this.targets)
    // This is correct - no additional filtering needed

    if (search) {
      filteredTargets = filteredTargets.filter((target) =>
        target.tagName.toLowerCase().includes(search.toLowerCase())
      );
    }

    this.renderFilteredTargets(filteredTargets);
  }

  renderFilteredTargets(targets) {
    const tbody = document.getElementById("pacing-table-body");
    tbody.innerHTML = "";

    if (targets.length === 0) {
      tbody.innerHTML = `
                <tr>
                    <td colspan="12" class="px-6 py-4 text-center text-slate-500">
                        No targets match the current filters.
                    </td>
                </tr>
            `;
      return;
    }

    targets.forEach((target) => {
      const row = this.createTargetRow(target);
      tbody.appendChild(row);
    });
  }

  async apiCall(endpoint, method = "GET", data = null, returnText = false) {
    const options = {
      method,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    };

    if (data && method !== "GET") {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(endpoint, options);

    if (response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login.html";
      return;
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "API request failed");
    }

    if (returnText) {
      return await response.text();
    }

    return await response.json();
  }

  formatMonth(monthString) {
    const date = new Date(monthString + "-01");
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  }

  formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    if (i === 0) {
      return bytes + " " + sizes[i];
    } else if (i === 1) {
      return (bytes / k).toFixed(1) + " " + sizes[i];
    } else {
      return (bytes / Math.pow(k, i)).toFixed(2) + " " + sizes[i];
    }
  }

  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login.html";
  }
}

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new PacingTrackerApp();
});
