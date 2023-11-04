// This workflow requires no properties to include and connects to Hubspots API. You just need to create the secret key and use the name HUBSPOTTOKEN as the secret key name.

const hubspot = require('@hubspot/api-client');

function delay(duration) {
  return new Promise(resolve => setTimeout(resolve, duration));
}

exports.main = async (event, callback) => {
  // Instantiate a new HubSpot API client using the HAPI key (secret)
  const hubspotClient = new hubspot.Client({
    accessToken: process.env.HUBSPOTTOKEN
  });

try {
  const contactId = event.object.objectId;
  const contactProperties = ["company_id"];
  
  // Retrive the currently enrolled contacts "Company ID" property
  const contactResults = await hubspotClient.crm.contacts.basicApi.getById(contactId, contactProperties);
  let myCompanyID = contactResults.properties.company_id; // Get data from the results and store in variables
  
  // Create search criteria  
  const filter = { propertyName: 'tc_company_id', operator: 'EQ', value: myCompanyID }
  const filterGroup = { filters: [filter] }
  const sort = JSON.stringify({ propertyName: 'tc_company_id', direction: 'DESCENDING'})
  const properties = [ 'name', 'tc_company_id' ]
  const limit = 1
  const after = 0

  const searchCriteria = {
    filterGroups: [filterGroup],
    sorts: [sort],
    properties,
    limit,
    after
  }
  
  // Throttle the request: wait for a specified time before proceeding
  await delay(400); // Wait 400 milliseconds before the search request
     
  // Search the CRM via API call for Companies matching "myCompanyID" variable defined earlier
  const searchCompanyResponse = await hubspotClient.crm.companies.searchApi.doSearch(searchCriteria);

    if ( searchCompanyResponse.total >= 1 ) {
      let company_record_id = searchCompanyResponse.results[0].id;
      
      // Throttle the request: wait for a specified time before proceeding
      await delay(100); // Wait 100 milliseconds before the association request

      // Call the API to associate the company with the contact
      await hubspotClient.crm.companies.associationsApi.create(
        company_record_id,
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
  
  callback({ outputFields: {} });
      
  } catch (err) {
    console.log(err);
    throw err;
  }
};
