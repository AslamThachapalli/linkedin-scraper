const axios = require('axios')
const cheerio = require('cheerio')
const axiosRetry = require('axios-retry').default
const ObjectsToCsv = require('objects-to-csv')

axiosRetry(axios, {
    retries: 5,
    retryDelay: (retryCount) => {
        return retryCount * 5000; // exponential backoff
    },
    retryCondition: (error) => {
        return error.response.status === 429; // retry only on 429
    },
});

let linkedInJobs = []

const headers = {
    'accept':
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'accept-encoding':
        'gzip, deflate, br, zstd',
    'accept-language':
        'en-GB,en-US;q=0.9,en;q=0.8',
    'cookie':
        'li_sugr=f3640c0c-bb1c-4e3e-a8fc-4aa755d88d5f; bcookie="v=2&d64ec53c-6406-4ad8-8254-72457045cf70"; bscookie="v=1&202407111300486b207e46-f8bc-4afc-8b8b-6cd1b120cb5bAQEzl1tUW93fSkTEm9G1eSu0qU-SAOsN"; aam_uuid=16933088565839310942627347312591719012; li_rm=AQHK5wmJK4gqewAAAZGpzLo8k6zeuKx-acoGOpVbm2iU7iA1LCJ_rEuQ8TOKCUM-xwsNOBpsZ_LeiH7oOo3IN0EBvsK1Jq7JV1UGMDoEXBb4l69zmQu-kEQp; _gcl_au=1.1.1110846249.1725130655; JSESSIONID=ajax:9055127230229826750; lang=v=2&lang=en-us; AMCVS_14215E3D5995C57C0A495C55%40AdobeOrg=1; g_state={"i_p":1725876752507,"i_l":3}; _uetvid=0186fe20684611ef85ee0951d847003c; lidc="b=TGST05:s=T:r=T:a=T:p=T:g=3109:u=1:x=1:i=1725430819:t=1725517219:v=2:sig=AQHEVN90Z-DpFKf1gEufKvT_J-0IOTQq"; AMCV_14215E3D5995C57C0A495C55%40AdobeOrg=-637568504%7CMCIDTS%7C19971%7CMCMID%7C17071372910403069732646174058863507887%7CMCAAMLH-1726035620%7C12%7CMCAAMB-1726035620%7C6G1ynYcLPuiQxYZrsz_pkqfLG9yMXBpb2zX5dvJdYQJzPXImdj0y%7CMCOPTOUT-1725438020s%7CNONE%7CvVersion%7C5.1.1; ccookie=0001AQGEO3jUdxA/cwAAAZG7sTrAaRa3bCEiGyAb1gIBg7iDU/pWC2HZXB0sYAHayIRd80vM4aglyfueYSLaEVGVEkyJRDTBpnTpIQSJKe4bccfXy5fy+nTBscC8a3d9+KAwjQzSob9+8q+G90HRyVXlxQ5dSSBgt8GdoDSaFS8Mtpvhkr6EXTo=',
    'priority':
        'u=0, i',
    'referer':
        'https://www.linkedin.com/jobs/search?trk=guest_homepage-basic_guest_nav_menu_jobs&original_referer=https%3A%2F%2Fwww.linkedin.com%2F&position=1&pageNum=0',
    'sec-ch-ua':
        '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
    'sec-ch-ua-mobile':
        '?0',
    'sec-ch-ua-platform':
        '"macOS"',
    'sec-fetch-dest':
        'document',
    'sec-fetch-mode':
        'navigate',
    'sec-fetch-site':
        'same-origin',
    'sec-fetch-user':
        '?1',
    'upgrade-insecure-requests':
        '1',
    'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
}

const scrape = () => {
    for (let pageNumber =0; pageNumber < 1000; pageNumber += 10) {
        const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=Javascript%2BDeveloper&location=Bengaluru%2C%2BKarnataka%2C%2BIndia&geoId=105214831&trk=public_jobs_jobs-search-bar_search-submit&start=${pageNumber}`

        new Promise((resolve) => setTimeout(resolve, 5000)).then(() => {
            axios({
                url,
                headers,
            })
                .then(async res => {
                    const html = res.data;
                    const $ = cheerio.load(html)

                    linkedInJobs.length = 0

                    const jobs = $('li')
                    for (let i = 0; i < jobs.length; i++) {
                        const jobTitle = jobs.eq(i).find('h3.base-search-card__title').text().trim()
                        const company = jobs.eq(i).find('h4.base-search-card__subtitle').text().trim()
                        const location = jobs.eq(i).find('span.job-search-card__location').text().trim()
                        const postedOn = jobs.eq(i).find('time').attr('datetime')
                        const link = jobs.eq(i).find('a.base-card__full-link').attr('href')
                        linkedInJobs.push({
                            'Title': jobTitle,
                            'Company': company,
                            'Location': location,
                            'PostedOn': postedOn,
                            'Link': link
                        })
                    }

                    const csv = new ObjectsToCsv(linkedInJobs)
                    csv.toDisk('./linkedInJobs.csv', { append: true })

                }).catch(err => {
                    console.log('error: ', err)
                })
        })
    }
}

scrape()



