{/* <Row className="align-items-end mb-3">

    <div className="d-flex justify-content-start gap-2 mb-2 me-0 pe-0 ps-0 ms-0" style={{ flex: "0 0 50%" }}>
        <Button
            variant="outline-secondary"
            title="Refresh Tickets"
            size="sm"
            onClick={handleRefresh}
        >
            <FontAwesomeIcon icon={faRefresh} /> Refresh
        </Button>

        <Dropdown
            show={showSearchDropdown}
            onToggle={() => setShowSearchDropdown(!showSearchDropdown)}
        >
            <Dropdown.Toggle variant="outline-secondary" as={Button} size="sm">
                <FontAwesomeIcon icon={faMagnifyingGlass} />
            </Dropdown.Toggle>

            <Dropdown.Menu align="end" style={{ minWidth: "300px" }}>
                <Form className="px-3 py-2">
                    <Form.Label className="small text-muted mb-1">Search Filter</Form.Label>
                    <Form.Select
                        value={searchType}
                        onChange={(e) => {
                            setSearchType(e.target.value);
                            setSearchTextInput("");
                        }}
                        className="mb-2"
                        size="sm"
                    >
                        <option value="name">Name / Contact</option>
                        <option value="employeeName">Employee Name</option>
                        <option value="accommodation">Accommodation</option>
                    </Form.Select>

                    {searchType === "employeeName" ? (
                        <Form.Select
                            value={searchTextInput}
                            onChange={(e) => setSearchTextInput(e.target.value)}
                            className="mb-2"
                            size="sm"
                        >
                            <option value="">Select Employee</option>
                            {Object.values(employeeMap).map((emp) => (
                                <option key={emp.employeeId} value={emp.employeeId}>
                                    {emp.firstname} {emp.surname}
                                </option>
                            ))}
                        </Form.Select>
                    ) : (
                        <FormControl
                            type="text"
                            placeholder={
                                searchType === "name"
                                    ? "Search by name or contact"
                                    : "Search by accommodation"
                            }
                            value={searchTextInput}
                            onChange={(e) => setSearchTextInput(e.target.value)}
                            className="mb-2"
                            size="sm"
                        />
                    )}

                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                            setShowSearchDropdown(false);
                            handleSearch();
                        }}
                    >
                        Search
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        className="ms-2"
                        onClick={() => {
                            setSearchTextInput("");
                            setSearchType("name");
                            setShowSearchDropdown(false);
                            handleSearchReset?.();

                        }}
                    >
                        Reset
                    </Button>
                </Form>

            </Dropdown.Menu>
        </Dropdown>

        <Dropdown
            show={showGroupFilter}
            onToggle={() => setShowGroupFilter(!showGroupFilter)}
        >
            <Dropdown.Toggle
                variant="outline-secondary"
                title="Group Filter"
                size="sm"
            >
                <FontAwesomeIcon icon={faLayerGroup} />
            </Dropdown.Toggle>

            <Dropdown.Menu
                style={{ minWidth: "280px", padding: "15px", maxHeight: "400px", overflowY: "auto" }}
            >
                <Form>
                    <Form.Group controlId="filter-status" className="mb-3">
                        <Form.Label>Status</Form.Label>
                        <Form.Select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            size="sm"
                        >
                            <option value="">All</option>
                            <option value="Queued">Queued</option>
                            <option value="On Time">On Time</option>
                            <option value="Ongoing">Ongoing</option>
                            <option value="Done">Done</option>
                            <option value="Delayed">Delayed</option>
                            <option value="Canceled">Canceled</option>
                            <option value="Schedule Change">Schedule Change</option>
                            <option value="Reassigned">Reassigned</option>
                            <option value="Relocate">Relocate</option>
                            <option value="On Emergency">On Emergency</option>
                        </Form.Select>

                    </Form.Group>

                    <Form.Group controlId="filter-country" className="mb-3">
                        <Form.Label>Country</Form.Label>
                        <Select
                            options={countryOptions}
                            value={
                                filterCountry
                                    ? { value: filterCountry, label: filterCountry }
                                    : { value: "", label: "All Countries" }
                            }
                            onChange={(selected) => setFilterCountry(selected?.value || "")}
                            isClearable
                            placeholder="Select Country"
                            styles={{ control: (base) => ({ ...base, minHeight: "31px", fontSize: "0.875rem" }) }}
                        />
                    </Form.Group>

                    <Form.Group controlId="filter-town" className="mb-3">
                        <Form.Label>Town</Form.Label>
                        <Select
                            options={townOptions}
                            value={
                                filterTown
                                    ? { value: filterTown, label: filterTown }
                                    : { value: "", label: "All Towns" }
                            }
                            onChange={(selected) => setFilterTown(selected?.value || "")}
                            isClearable
                            placeholder="Select Town"
                            styles={{ control: (base) => ({ ...base, minHeight: "31px", fontSize: "0.875rem" }) }}
                        />
                    </Form.Group>

                    <Form.Group controlId="filter-residency" className="mb-3">
                        <Form.Label>Residency</Form.Label>
                        <Form.Select
                            value={filterResidency}
                            onChange={(e) => setFilterResidency(e.target.value)}
                            size="sm"
                        >
                            <option value="">All</option>
                            <option value="local">Local</option>
                            <option value="foreign">Foreign</option>
                        </Form.Select>
                    </Form.Group>

                    <Form.Group controlId="filter-sex" className="mb-3">
                        <Form.Label>Sex</Form.Label>
                        <Form.Select
                            value={filterSex}
                            onChange={(e) => setFilterSex(e.target.value)}
                            size="sm"
                        >
                            <option value="">All</option>
                            <option value="males">Male</option>
                            <option value="females">Female</option>
                            <option value="prefer_not_to_say">Prefer not to say</option>
                        </Form.Select>
                    </Form.Group>

                    <Form.Group controlId="filter-age" className="mb-3">
                        <Form.Label>Age Bracket</Form.Label>
                        <Form.Select
                            value={filterAgeBracket}
                            onChange={(e) => setFilterAgeBracket(e.target.value)}
                            size="sm"
                        >
                            <option value="">All</option>
                            <option value="kids">Kids</option>
                            <option value="teens">Teens</option>
                            <option value="adults">Adults</option>
                            <option value="seniors">Seniors</option>
                        </Form.Select>
                    </Form.Group>

                    <div className="d-grid gap-2 mt-3">
                        <Button variant="primary" size="sm" onClick={() => handleSearch()}>
                            Apply Filters
                        </Button>
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => {
                                setFilterStatus("");
                                setFilterResidency("");
                                setFilterSex("");
                                setFilterAgeBracket("");
                                setFilterCountry("");
                                setFilterTown("");
                                setFilteredTickets(allFilteredTickets);
                            }}
                        >
                            Reset
                        </Button>
                    </div>
                </Form>
            </Dropdown.Menu>
        </Dropdown>

        <Dropdown
            show={showDateSearchDropdown}
            onToggle={() => setShowDateSearchDropdown(!showDateSearchDropdown)}
        >
            <Dropdown.Toggle
                as={Button}
                variant="outline-secondary"
                title="Date Range Search"
                size="sm"
            >
                <FontAwesomeIcon icon={faCalendarDays} />
            </Dropdown.Toggle>

            <Dropdown.Menu className="p-3" style={{ minWidth: "250px" }}>
                <Form.Group className="mb-2">
                    <Form.Label className="small mb-1 text-muted">Start Date</Form.Label>
                    <Form.Control
                        type="date"
                        value={startDateInput}
                        onChange={(e) => setStartDateInput(e.target.value)}
                        size="sm"
                    />
                </Form.Group>
                <Form.Group className="mb-2">
                    <Form.Label className="small mb-1 text-muted">End Date</Form.Label>
                    <Form.Control
                        type="date"
                        value={endDateInput}
                        min={startDateInput}
                        onChange={(e) => setEndDateInput(e.target.value)}
                        size="sm"
                    />
                </Form.Group>
                <Form.Label className="small text-muted mt-3">Quick Date Filters</Form.Label>
                <div className="d-flex flex-wrap gap-2 mb-2">
                    <Button variant="outline-secondary" size="sm" onClick={() => applyQuickFilter("today")}>Today</Button>
                    <Button variant="outline-secondary" size="sm" onClick={() => applyQuickFilter("thisWeek")}>This Week</Button>
                    <Button variant="outline-secondary" size="sm" onClick={() => applyQuickFilter("thisMonth")}>This Month</Button>
                    <Button variant="outline-secondary" size="sm" onClick={() => applyQuickFilter("thisHalfOfTheMonth")}>This Half Month</Button>
                    <Button variant="outline-secondary" size="sm" onClick={() => applyQuickFilter("thisYear")}>This Year</Button>
                </div>

                <Form.Group className="mb-3">
                    <Form.Label className="small text-muted">Select Month</Form.Label>
                    <Form.Control
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => {
                            setSelectedMonth(e.target.value);
                            if (e.target.value) {
                                const [year, month] = e.target.value.split("-");
                                const start = new Date(year, month - 1, 1);
                                const end = new Date(year, month, 0);
                                end.setHours(23, 59, 59, 999);
                                const formatDateLocal = (date) => date.toLocaleDateString("en-CA");
                                setStartDateInput(formatDateLocal(start));
                                setEndDateInput(formatDateLocal(end));
                                setSelectedDateFilter("");
                                setSelectedYear("");
                            }
                        }}
                        size="sm"
                    />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label className="small text-muted">Select Year</Form.Label>
                    <Form.Control
                        type="number"
                        placeholder="e.g. 2025"
                        value={selectedYear}
                        min="2000"
                        max="2100"
                        onChange={(e) => {
                            const input = e.target.value;
                            setSelectedYear(input);
                            if (input.length === 4 && !isNaN(input)) {
                                const start = new Date(input, 0, 1);
                                const end = new Date(input, 11, 31, 23, 59, 59, 999);
                                const formatDateLocal = (date) => date.toLocaleDateString("en-CA");
                                setStartDateInput(formatDateLocal(start));
                                setEndDateInput(formatDateLocal(end));
                                setSelectedDateFilter("");
                                setSelectedMonth("");
                            }
                        }}
                        size="sm"
                    />
                </Form.Group>

                <Button
                    variant="primary"
                    size="sm"
                    className="w-100 mt-2 mb-4"
                    onClick={() => {
                        setShowDateSearchDropdown(false);
                        setTriggerSearch(true);
                    }}
                >
                    Apply Date Filter
                </Button>
            </Dropdown.Menu>
        </Dropdown>

        <Button
            variant="outline-secondary"
            title="Download"
            onClick={handleDownloadTable}
            size="sm"
        >
            <FontAwesomeIcon icon={faDownload} />
        </Button>

        <Dropdown>
            <Dropdown.Toggle
                variant="outline-secondary"
                title="Export"
                size="sm"
            >
                <FontAwesomeIcon icon={faPrint} />
            </Dropdown.Toggle>
            <Dropdown.Menu>
                <Dropdown.Item onClick={exportToPDF}>Export as PDF</Dropdown.Item>
                <Dropdown.Item onClick={exportToExcel}>Export as Excel</Dropdown.Item>
            </Dropdown.Menu>
        </Dropdown>

        <Dropdown
            show={showColumnDropdown}
            onToggle={() => setShowColumnDropdown(!showColumnDropdown)}
        >
            <Dropdown.Toggle
                variant="outline-secondary"
                title="Customize Columns"
                size="sm"
            >
                <FontAwesomeIcon icon={faColumns} />
            </Dropdown.Toggle>

            <Dropdown.Menu
                style={{ maxHeight: "300px", overflowY: "auto", padding: "10px 15px", minWidth: "220px" }}
            >
                <div className="d-flex justify-content-between mb-2">
                    <Button
                        variant="link"
                        size="sm"
                        className="p-0"
                        onClick={() => setVisibleColumns(allColumns.map(col => col.key))}
                    >
                        Select All
                    </Button>
                    <Button
                        variant="link"
                        size="sm"
                        className="p-0"
                        onClick={() => setVisibleColumns([])}
                    >
                        Unselect All
                    </Button>
                </div>

                <Form>
                    {allColumns.map(col => (
                        <Form.Check
                            key={col.key}
                            type="checkbox"
                            id={`toggle-${col.key}`}
                            label={col.label}
                            checked={visibleColumns.includes(col.key)}
                            onChange={() => {
                                setVisibleColumns(prev =>
                                    prev.includes(col.key)
                                        ? prev.filter(k => k !== col.key)
                                        : [...prev, col.key]
                                );
                            }}
                            size="sm"
                        />
                    ))}
                </Form>
            </Dropdown.Menu>
        </Dropdown>


    </div>
</Row> */}


 <Row className="align-items-end mb-3">
         
          <Col lg={6} md={12} sm={12} xs={12} className="d-flex justify-content-lg-start justify-content-start gap-2 mb-2 me-0 pe-0 ps-0 ms-0">
            <Button
              variant="outline-secondary"
              title="Refresh Tickets"
              size="sm"
              onClick={handleRefresh}
            >
              <FontAwesomeIcon icon={faRefresh} />
            </Button>

           

            <Dropdown
              show={showGroupFilter}
              onToggle={() => setShowGroupFilter(!showGroupFilter)}
            >
              <Dropdown.Toggle
                variant="outline-secondary"
                title="Group Filter"
                size="sm"
              >
                <FontAwesomeIcon icon={faLayerGroup} />
              </Dropdown.Toggle>

              <Dropdown.Menu
                style={{ minWidth: "280px", padding: "15px", maxHeight: "400px", overflowY: "auto" }}
              >
                <Form>
                  {/* Status Filter */}
                  <Form.Group controlId="filter-status" className="mb-3">
                    <Form.Label>Status</Form.Label>
                    <Form.Select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      size="sm"
                    >
                      <option value="">All</option>
                      <option value="Queued">Queued</option>
                      <option value="On Time">On Time</option>
                      <option value="Ongoing">Ongoing</option>
                      <option value="Done">Done</option>
                      <option value="Delayed">Delayed</option>
                      <option value="Canceled">Canceled</option>
                      <option value="Schedule Change">Schedule Change</option>
                      <option value="Reassigned">Reassigned</option>
                      <option value="Relocate">Relocate</option>
                      <option value="On Emergency">On Emergency</option>
                    </Form.Select>

                  </Form.Group>

                  {/* Country Filter */}
                  <Form.Group controlId="filter-country" className="mb-3">
                    <Form.Label>Country</Form.Label>
                    <Select
                      options={countryOptions}
                      value={
                        filterCountry
                          ? { value: filterCountry, label: filterCountry }
                          : { value: "", label: "All Countries" }
                      }
                      onChange={(selected) => setFilterCountry(selected?.value || "")}
                      isClearable
                      placeholder="Select Country"
                      styles={{ control: (base) => ({ ...base, minHeight: "31px", fontSize: "0.875rem" }) }}
                    />
                  </Form.Group>

                  {/* Town Filter */}
                  <Form.Group controlId="filter-town" className="mb-3">
                    <Form.Label>Town</Form.Label>
                    <Select
                      options={townOptions}
                      value={
                        filterTown
                          ? { value: filterTown, label: filterTown }
                          : { value: "", label: "All Towns" }
                      }
                      onChange={(selected) => setFilterTown(selected?.value || "")}
                      isClearable
                      placeholder="Select Town"
                      styles={{ control: (base) => ({ ...base, minHeight: "31px", fontSize: "0.875rem" }) }}
                    />
                  </Form.Group>

                  {/* Residency Filter */}
                  <Form.Group controlId="filter-residency" className="mb-3">
                    <Form.Label>Residency</Form.Label>
                    <Form.Select
                      value={filterResidency}
                      onChange={(e) => setFilterResidency(e.target.value)}
                      size="sm"
                    >
                      <option value="">All</option>
                      <option value="local">Local</option>
                      <option value="foreign">Foreign</option>
                    </Form.Select>
                  </Form.Group>

                  {/* Sex Filter */}
                  <Form.Group controlId="filter-sex" className="mb-3">
                    <Form.Label>Sex</Form.Label>
                    <Form.Select
                      value={filterSex}
                      onChange={(e) => setFilterSex(e.target.value)}
                      size="sm"
                    >
                      <option value="">All</option>
                      <option value="males">Male</option>
                      <option value="females">Female</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </Form.Select>
                  </Form.Group>

                  {/* Age Bracket Filter */}
                  <Form.Group controlId="filter-age" className="mb-3">
                    <Form.Label>Age Bracket</Form.Label>
                    <Form.Select
                      value={filterAgeBracket}
                      onChange={(e) => setFilterAgeBracket(e.target.value)}
                      size="sm"
                    >
                      <option value="">All</option>
                      <option value="kids">Kids</option>
                      <option value="teens">Teens</option>
                      <option value="adults">Adults</option>
                      <option value="seniors">Seniors</option>
                    </Form.Select>
                  </Form.Group>

                  <div className="d-grid gap-2 mt-3">
                    <Button variant="primary" size="sm" onClick={() => handleSearch()}>
                      Apply Filters
                    </Button>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => {
                        setFilterStatus("");
                        setFilterResidency("");
                        setFilterSex("");
                        setFilterAgeBracket("");
                        setFilterCountry("");
                        setFilterTown("");
                        setFilteredTickets(allFilteredTickets);
                      }}
                    >
                      Reset
                    </Button>
                  </div>
                </Form>
              </Dropdown.Menu>
            </Dropdown>

            <Dropdown
              show={showDateSearchDropdown}
              onToggle={() => setShowDateSearchDropdown(!showDateSearchDropdown)}
            >
              <Dropdown.Toggle
                as={Button}
                variant="outline-secondary"
                title="Date Range Search"
                size="sm"
              >
                <FontAwesomeIcon icon={faCalendarDays} />
              </Dropdown.Toggle>

              <Dropdown.Menu className="p-3" style={{ minWidth: "250px" }}>
                <Form.Group className="mb-2">
                  <Form.Label className="small mb-1 text-muted">Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={startDateInput}
                    onChange={(e) => setStartDateInput(e.target.value)}
                    size="sm"
                  />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label className="small mb-1 text-muted">End Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={endDateInput}
                    min={startDateInput}
                    onChange={(e) => setEndDateInput(e.target.value)}
                    size="sm"
                  />
                </Form.Group>
                <Form.Label className="small text-muted mt-3">Quick Date Filters</Form.Label>
                <div className="d-flex flex-wrap gap-2 mb-2">
                  <Button variant="outline-secondary" size="sm" onClick={() => applyQuickFilter("today")}>Today</Button>
                  <Button variant="outline-secondary" size="sm" onClick={() => applyQuickFilter("thisWeek")}>This Week</Button>
                  <Button variant="outline-secondary" size="sm" onClick={() => applyQuickFilter("thisMonth")}>This Month</Button>
                  <Button variant="outline-secondary" size="sm" onClick={() => applyQuickFilter("thisHalfOfTheMonth")}>This Half Month</Button>
                  <Button variant="outline-secondary" size="sm" onClick={() => applyQuickFilter("thisYear")}>This Year</Button>
                </div>

                {/* Select Month Filter */}
                <Form.Group className="mb-3">
                  <Form.Label className="small text-muted">Select Month</Form.Label>
                  <Form.Control
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => {
                      setSelectedMonth(e.target.value);
                      if (e.target.value) {
                        const [year, month] = e.target.value.split("-");
                        const start = new Date(year, month - 1, 1);
                        const end = new Date(year, month, 0);
                        end.setHours(23, 59, 59, 999);
                        const formatDateLocal = (date) => date.toLocaleDateString("en-CA");
                        setStartDateInput(formatDateLocal(start));
                        setEndDateInput(formatDateLocal(end));
                        setSelectedDateFilter("");
                        setSelectedYear("");
                      }
                    }}
                    size="sm"
                  />
                </Form.Group>

                {/* Select Year Filter */}
                <Form.Group className="mb-3">
                  <Form.Label className="small text-muted">Select Year</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="e.g. 2025"
                    value={selectedYear}
                    min="2000"
                    max="2100"
                    onChange={(e) => {
                      const input = e.target.value;
                      setSelectedYear(input);
                      if (input.length === 4 && !isNaN(input)) {
                        const start = new Date(input, 0, 1);
                        const end = new Date(input, 11, 31, 23, 59, 59, 999);
                        const formatDateLocal = (date) => date.toLocaleDateString("en-CA");
                        setStartDateInput(formatDateLocal(start));
                        setEndDateInput(formatDateLocal(end));
                        setSelectedDateFilter("");
                        setSelectedMonth("");
                      }
                    }}
                    size="sm"
                  />
                </Form.Group>

                <Button
                  variant="primary"
                  size="sm"
                  className="w-100 mt-2 mb-4"
                  onClick={() => {
                    setShowDateSearchDropdown(false);
                    setTriggerSearch(true);
                  }}
                >
                  Apply Date Filter
                </Button>
              </Dropdown.Menu>
            </Dropdown>

            <Button
              variant="outline-secondary"
              title="Download"
              onClick={handleDownloadTable}
              size="sm"
            >
              <FontAwesomeIcon icon={faDownload} />
            </Button>

            <Dropdown>
              <Dropdown.Toggle
                variant="outline-secondary"
                title="Export"
                size="sm"
              >
                <FontAwesomeIcon icon={faPrint} />
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={exportToPDF}>Export as PDF</Dropdown.Item>
                <Dropdown.Item onClick={exportToExcel}>Export as Excel</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

            <Dropdown
              show={showColumnDropdown}
              onToggle={() => setShowColumnDropdown(!showColumnDropdown)}
            >
              <Dropdown.Toggle
                variant="outline-secondary"
                title="Customize Columns"
                size="sm"
              >
                <FontAwesomeIcon icon={faColumns} />
              </Dropdown.Toggle>

              <Dropdown.Menu
                style={{ maxHeight: "300px", overflowY: "auto", padding: "10px 15px", minWidth: "220px" }}
              >
                <div className="d-flex justify-content-between mb-2">
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0"
                    onClick={() => setVisibleColumns(allColumns.map(col => col.key))}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0"
                    onClick={() => setVisibleColumns([])}
                  >
                    Unselect All
                  </Button>
                </div>

                <Form>
                  {allColumns.map(col => (
                    <Form.Check
                      key={col.key}
                      type="checkbox"
                      id={`toggle-${col.key}`}
                      label={col.label}
                      checked={visibleColumns.includes(col.key)}
                      onChange={() => {
                        setVisibleColumns(prev =>
                          prev.includes(col.key)
                            ? prev.filter(k => k !== col.key)
                            : [...prev, col.key]
                        );
                      }}
                      size="sm"
                    />
                  ))}
                </Form>
              </Dropdown.Menu>
            </Dropdown>


          </Col>
        </Row>
