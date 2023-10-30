const hubspot = require('@hubspot/api-client');

exports.main = async (event, callback) => {
  
  // Instantiate a new HubSpot API client using the HAPI key (secret)
  const hubspotClient = new hubspot.Client({
    accessToken: process.env.HUBSPOTTOKEN
  });
  
  // variable used for Company ID
  const companyId = event.object.objectId;

  // Retrive the currently enrolled companies "TC Company ID" property
  hubspotClient.crm.companies.basicApi
    .getById(companyId, ["tc_company_id", "oe_enrollment_calls_start_date", "oe_enrollment_calls_end_date", "oe_custom_email_series", "num_associated_contacts" ])
    .then(results => {
	// Get data from the results and store in variables
    const tcCompanyID = results.properties.tc_company_id;
    const numAssociatedContacts = results.properties.num_associated_contacts;
    
	const pageTotal = numAssociatedContacts/100;
    const newPageTotal = Math.round(pageTotal);
    //console.log(newPageTotal);

    //console.log("Company Record ID: " + companyId); // FOR DEBUG
    //console.log("Company Property (TC Company ID): " + tcCompanyID); // FOR DEBUG
    
    const oeCallStartDate = results.properties.oe_enrollment_calls_start_date;
    const oeCallEndDate = results.properties.oe_enrollment_calls_end_date;
    const oeCustomEmailSeries = results.properties.oe_custom_email_series;

	// Create search criteria  
    const filter = { propertyName: 'company_id', operator: 'EQ', value: tcCompanyID }
	const filterGroup = { filters:	[filter] 	}
        const sort = JSON.stringify({ propertyName: 'company_id', direction: 'DESCENDING'})
        const properties = [ 'name', 'company_id', 'oe_enrollment_calls_start_date', 'oe_enrollment_calls_end_date', 'oe_custom_email_series_was_created' ]
        const limit = 99
        const after = newPageTotal

        const searchCriteria = {
          filterGroups: [filterGroup],
          sorts: [sort],
          properties,
          limit,
          after
        }  

      // Search the CRM for Contact matching "CompanyID" variable defined earlier
      hubspotClient.crm.contacts.searchApi.doSearch(searchCriteria).then(searchContactResponse => {
       
       //let total_results = searchContactResponse.total;
       //console.log("Total Results: " + total_results ); // FOR DEBUG
        
       for (var k = 0; k < searchContactResponse.total; k++) {
         
         let batch_contact_record_id = searchContactResponse.results[k].id;
         //console.log("Contact Record ID: " + batch_contact_record_id ); // FOR DEBUG
         
          hubspotClient.crm.contacts.basicApi.update(batch_contact_record_id, {"properties":{
            "oe_enrollment_calls_start_date": oeCallStartDate,
            "oe_enrollment_calls_end_date": oeCallEndDate,
            "oe_custom_email_series_was_created": oeCustomEmailSeries 
          }});
          hubspotClient.crm.companies.associationsApi.create(
              companyId,
              'contacts', 
              batch_contact_record_id,
                     [
                      {
                        "associationCategory": "HUBSPOT_DEFINED",
                        "associationTypeId": 2 
                      }
                    ]
           );
        }  
        
      });
    
      callback({outputFields: {}});
    })
    .catch(err => {
      console.error(err);
    });
}
