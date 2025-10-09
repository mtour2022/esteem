class TourismData {
  constructor({
    id = "",
    year = "",
    totalVisitors = 0,

    // Visitor Type Breakdown
    visitorTypeBreakdown = {
      foreign: 0,
      domestic: 0,
      ofw: 0,
      immigrants: 0,
      halalTravelers: 0,
    },

    // Sex Segregation
    sexSegregation = {
      male: 0,
      female: 0,
      preferNotToSay: 0,
    },

    // Age Group
    ageGroup = {
      "0-12": 0,
      "13-59": 0,
      "60-above": 0,
    },

    // Mode of Transportation
    modeOfTransportation = {
      air: 0,
      land: 0,
      sea: 0,
    },

    // Monthly Data
    monthlyData = [
      {
        month: "January",
        totalVisitors: 0,
        visitorTypeBreakdown: {
          foreign: 0,
          domestic: 0,
          ofw: 0,
          immigrants: 0,
          halalTravelers: 0,
        },
        sexSegregation: {
          male: 0,
          female: 0,
          preferNotToSay: 0,
        },
        ageGroup: {
          "0-12": 0,
          "13-59": 0,
          "60-above": 0,
        },
        modeOfTransportation: {
          air: 0,
          land: 0,
          sea: 0,
        },
      },
    ],

    // Optional Metadata
    preparedBy = "",
    checkedBy = "",
  }) {
    this.id = id;
    this.year = year;
    this.totalVisitors = totalVisitors;
    this.visitorTypeBreakdown = visitorTypeBreakdown;
    this.sexSegregation = sexSegregation;
    this.ageGroup = ageGroup;
    this.modeOfTransportation = modeOfTransportation;
    this.monthlyData = Array.isArray(monthlyData) ? monthlyData : [];
    this.preparedBy = preparedBy;
    this.checkedBy = checkedBy;
  }
}

export default TourismData;
