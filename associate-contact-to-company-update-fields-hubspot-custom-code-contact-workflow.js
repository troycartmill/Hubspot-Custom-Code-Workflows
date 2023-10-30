const hubspot = require('@hubspot/api-client');

exports.main = async (event, callback) => {
  
  // Instantiate a new HubSpot API client using the HAPI key (secret)
  const hubspotClient = new hubspot.Client({
    accessToken: process.env.HUBSPOTTOKEN
  });
  
  let contactId = event.object.objectId;


// Retrive the currently enrolled contacts "Company ID" property
  hubspotClient.crm.contacts.basicApi
    .getById(contactId, ["company_id"])
    .then(results => {
	// Get data from the results and store in variables
    let myCompanyID = results.properties.company_id;
	// let companyName = results.properties.company;
        //console.log("SEARCH TERM: " + companyName);
    console.log("Contact Property (Company ID): " + myCompanyID);

	// Create search criteria  
    const filter = { propertyName: 'tc_company_id', operator: 'EQ', value: myCompanyID }
	const filterGroup = { filters:	[filter] 	}
        const sort = JSON.stringify({ propertyName: 'tc_company_id', direction: 'DESCENDING'})
        const properties = [ 'name', 'tc_company_id', 'oe_dedicated_enrollment_start_date', 'oe_dedicated_enrollment_end_date', 'oe_enrollment_start_date', 'oe_enrollment_end_date' ]
        const limit = 1
        const after = 0
        
        const searchCriteria = {
          filterGroups: [filterGroup],
          sorts: [sort],
          properties,
          limit,
          after
        }  
     
      // Search the CRM for Companies matching "myCompanyID" variable defined earlier
      hubspotClient.crm.companies.searchApi.doSearch(searchCriteria).then(searchCompanyResponse => {
      
      console.log("RESULTS: " + searchCompanyResponse.total); // - FOR DEBUG
      
      let company_record_id = searchCompanyResponse.results[0].id;
      console.log("Company Object (Record ID): " + company_record_id); // - FOR DEBUG
      
      let company_tc_company_id = searchCompanyResponse.results[0].properties.tc_company_id;
      console.log("Company Object (TC Company ID): " + company_tc_company_id); // - FOR DEBUG
      
      let oeCallStartDate = searchCompanyResponse.results[0].properties.oe_dedicated_enrollment_start_date;
      let oeCallEndDate = searchCompanyResponse.results[0].properties.oe_dedicated_enrollment_end_date;
      let oePeriodStartDate = searchCompanyResponse.results[0].properties.oe_email_series_start_date;
      let oePeriodEndDate = searchCompanyResponse.results[0].properties.oe_email_series_end_date;
      //console.log("Company Object (OE Enrollment Call End Date): " + oeCallEndDate); // - FOR DEBUG
        
      hubspotClient.crm.contacts.basicApi.update(contactId, {"properties":{
        "oe_dedicated_enrollment_start_date": oeCallStartDate,
        "oe_dedicated_enrollment_end_date": oeCallEndDate,
        "oe_email_series_start_date": oePeriodStartDate,
        "oe_email_series_end_date": oePeriodEndDate
        
      }});

        /*
        hubspotClient.crm.companies.associationsApi.create(
          the_company_id,
          'contacts', 
          contactId,
                 [
                  {
                    "associationCategory": "HUBSPOT_DEFINED",
                    "associationTypeId": 2 
                  }
                ]
               );
               */
      });
   
      callback({outputFields: {}});
    
    })
    .catch(err => {
      console.error(err);
    });
}
