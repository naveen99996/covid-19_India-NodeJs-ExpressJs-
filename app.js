const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "covid19India.db");

const app = express();
app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({ filename: databasePath, driver: sqlite3.Database });
    app.listen(3006, () => {
      console.log("Server Running at http://localhost:3006/");
    });
  } catch (error) {
    console.log(`DB Error:${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateName: dbObject.state_name,
    population: dbObject.population,
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

// API 1 Getting all state

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
            SELECT * FROM state  `;
  const statesList = await database.all(getStatesQuery);
  response.send(
    statesList.map((eachObject) => convertDbObjectToResponseObject(eachObject))
  );
});

// API 2 Getting Particular state based on state_id

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
            SELECT * FROM state
            WHERE state_id = ${stateId}`;
  const stateDetails = await database.get(getStateQuery);
  response.send(convertDbObjectToResponseObject(stateDetails));
});

// API 3 creating District

app.post("/districts/", async (request, response) => {
  const newDistrict = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = newDistrict;
  const postDistrictQuery = `
    INSERT INTO district (district_name, state_id, cases, cured, active, deaths)
    VALUES ('${districtName}','${stateId}','${cases}','${cured}','${active}','${deaths}');`;
  const addDistrict = await database.run(postDistrictQuery);
  const districtId = addDistrict.lastId;
  response.send("District Successfully Added");
});

// API 4 getting district based on district_id

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
            SELECT * FROM district
            WHERE district_id = ${districtId};`;
  const newDistrict = await database.get(getDistrictQuery);
  response.send(convertDbObjectToResponseObject(newDistrict));
});

//API 5 Removing district from district table

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
            DELETE FROM district
            WHERE district_id = ${districtId};`;
  await database.run(deleteDistrictQuery);
  response.send("District Removed");
});

//API 6 Update the district based on the district_id

app.put("/districts/:districtId/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const { districtId } = request.params;
  const updateDistrictQuery = `
    UPDATE district SET district_name = '${districtName}',
                      state_id = '${stateId}',
                      cases = '${cases}',
                      cured = '${cured}',
                      active = '${active}',
                      deaths = '${deaths}'
    WHERE district_id = ${districtId};`;
  await database.run(updateDistrictQuery);
  response.send("District Details Updated");
});

// API 7 Getting statistics of Particular state

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
            SELECT SUM(cases),
                SUM(cured),
                SUM(active),
                SUM(deaths)
            FROM district
            WHERE state_id = ${stateId}`;
  const stateDetails = await database.get(getStateQuery);
  response.send({
    totalCases: stateDetails["SUM(cases)"],
    totalCured: stateDetails["SUM(cured)"],
    totalActive: stateDetails["SUM(active)"],
    totalDeaths: stateDetails["SUM(deaths)"],
  });
});

// API 8 Getting State Name Based on district_Id

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
            SELECT state_name FROM state NATURAL JOIN district
            WHERE district_id = ${districtId};`;
  const stateName = await database.get(getDistrictQuery);
  response.send(convertDbObjectToResponseObject(stateName));
});

module.exports = app;
