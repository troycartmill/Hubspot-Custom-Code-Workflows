// This workflow requires no properties to include. It uses Hubspots API. You just need to create the secret key and use the name HUBSPOTTOKEN as the secret key name.

const hubspot = require('@hubspot/api-client');

exports.main = async (event, callback) => {
  
  // Instantiate a new HubSpot API client using the HAPI key (secret)
  const hubspotClient = new hubspot.Client({
    accessToken: process.env.HUBSPOTTOKEN
  });
  
  let contactId = event.object.objectId;

// Retrive the currently enrolled contacts "company" property
  hubspotClient.crm.contacts.basicApi
    .getById(contactId, ["company"])
    .then(results => {
	// Get data from the results and store in variables
	let companyName = results.properties.company;
        console.log("SEARCH TERM: " + companyName);
    console.log("Contact ID: " + contactId);

	// Create search criteria   
	const filter = { propertyName: 'name', operator: 'EQ', value: companyName }
	const filterGroup = { filters:	[filter] 	}
        const sort = JSON.stringify({ propertyName: 'name', direction: 'DESCENDING'})
        const properties = ['name']
        const limit = 1
        const after = 0
        
        const searchCriteria = {
          filterGroups: [filterGroup],
          sorts: [sort],
          properties,
          limit,
          after
        }
    
      // Search the CRM for Companies matching "companyName" variable defined earlier
      hubspotClient.crm.companies.searchApi.doSearch(searchCriteria).then(searchCompanyResponse => {
        
         console.log("RESULTS: " + searchCompanyResponse.total); // - FOR DEBUG
 
         // If total equals 0 no results found
         if(searchCompanyResponse.total == 0){ //NO MATCH FOUND - CREATE COMPANY AND ASSOCIATE
           console.log("COMPANY " + companyName  + "NOT FOUND: CREATE + ASSOCIATE") // - FOR DEBUG
           
           //Create a Company object
            const companyObj = {
                properties: {
                    name: companyName,
                },
            }
           
           //Create the Company using Company object above
           hubspotClient.crm.companies.basicApi.create(companyObj).then(companyCreateResponse =>{
             //Associate Company with Contact using the ID returned from the previous request
             hubspotClient.crm.companies.associationsApi.create(companyCreateResponse.id,'contacts', contactId,'company_to_contact');
           });
           
         }else{ // MATCH FOUND - ASSOCIATE COMPANY TO CONTACT
           let rs_company_id = searchCompanyResponse.results[0].id;
            console.log("COMPANY " + companyName + " FOUND: ASSOCIATE RECORDS"); // - FOR DEBUG
           console.log("Contact ID: " + contactId); // - FOR DEBUG
           console.log("Company ID: " + rs_company_id); // - FOR DEBUG
          //Associate Company with Contact
           hubspotClient.crm.companies.associationsApi.create(
             rs_company_id,
             'contacts', 
             contactId,
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
