<template>
  <footer class="drexel-footer " role="contentinfo">
    <div class="footer-container">
      <!-- <div class="footer-brand">
        <img
          src="../../assets/styles/images/epa-seal.svg"
          alt="United States Environmental Protection Agency"
          width="100"
          height="100"
        />
      </div> -->

      <div class="footer-columns">
        <!-- Column: Discover -->
        <div class="footer-column">
          <h2>Discover.</h2>
          <ul>
            <li><a href="https://www.epa.gov/accessibility">Accessibility</a></li>
            <li><a href="https://www.epa.gov/planandbudget">Budget & Performance</a></li>
            <li><a href="https://www.epa.gov/contracts">Contracting</a></li>
            <li><a href="https://www.epa.gov/home/wwwepagov-snapshots">Web Snapshot</a></li>
            <li><a href="https://www.epa.gov/grants">Grants</a></li>
            <li><a href="https://www.epa.gov/ocr/whistleblower-protections-epa-and-how-they-relate-non-disclosure-agreements-signed-epa-employees">No FEAR Act</a></li>
            <li><a href="https://www.epa.gov/privacy">Privacy</a></li>
            <li><a href="https://www.epa.gov/privacy/privacy-and-security-notice">Privacy & Security Notice</a></li>
          </ul>
        </div>

        <!-- Column: Connect -->
        <div class="footer-column">
          <h2>Connect.</h2>
          <ul>
            <li><a href="https://www.data.gov/">Data.gov</a></li>
            <li><a href="https://www.epa.gov/office-inspector-general/about-epas-office-inspector-general">Inspector General</a></li>
            <li><a href="https://www.epa.gov/careers">Jobs</a></li>
            <li><a href="https://www.epa.gov/newsroom">Newsroom</a></li>
            <li><a href="https://www.epa.gov/data">Open Government</a></li>
            <li><a href="https://www.regulations.gov/">Regulations.gov</a></li>
            <li><a href="https://www.epa.gov/newsroom/email-subscriptions-epa-news-releases">Subscribe</a></li>
            <li><a href="https://www.usa.gov/">USA.gov</a></li>
            <li><a href="https://www.whitehouse.gov/">White House</a></li>
          </ul>
        </div>

        <!-- Column: Ask / Follow -->
        <div class="footer-column">
          <h2>Ask.</h2>
          <ul>
            <li><a href="https://www.epa.gov/home/forms/contact-epa">Contact EPA</a></li>
            <li><a href="https://www.epa.gov/web-policies-and-procedures/epa-disclaimers">EPA Disclaimers</a></li>
            <li><a href="https://www.epa.gov/home/epa-hotlines">Hotlines</a></li>
            <li><a href="https://www.epa.gov/foia">FOIA Requests</a></li>
            <li><a href="https://www.epa.gov/home/frequent-questions-specific-epa-programstopics">Frequent Questions</a></li>
          </ul>

          <h2>Follow.</h2>
          <ul class="footer-social">
            <li><a href="https://www.facebook.com/EPA" aria-label="Facebook"></a></li>
            <li><a href="https://twitter.com/epa" aria-label="Twitter"></a></li>
            <li><a href="https://www.youtube.com/user/USEPAgov" aria-label="YouTube"></a></li>
            <li><a href="https://www.flickr.com/photos/usepagov" aria-label="Flickr"></a></li>
            <li><a href="https://www.instagram.com/epagov" aria-label="Instagram"></a></li>
          </ul>

          <p class="footer-updated">Last updated on July 16, 2021</p>
        </div>
      </div>
    </div>
  </footer>
</template>

<script>
export default {
  name: "Footer"
};
</script>

<style scoped>
.footer-container {
  width: 100%;
  margin: auto;
  padding: 2rem 1rem;
  display: flex;
  flex-direction: column;
  background-color: #002663;
  color: white;
  font-family: 'Open Sans', sans-serif;
}

.footer-brand {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
}

.footer-columns {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  justify-content: space-between;
}

.footer-column {
  flex: 1 1 260px;
}

.footer-column h2 {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #ffe600;
}

.footer-column ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-column li {
  margin-bottom: 0.5rem;
}

.footer-column a {
  color: white;
  text-decoration: none;
}

.footer-column a:hover {
  text-decoration: underline;
}

.footer-social {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.footer-social svg {
  width: 24px;
  height: 24px;
  fill: #ffe600;
  transition: fill 0.3s;
}

.footer-social a:hover svg {
  fill: #ffffff;
}

.footer-updated {
  font-size: 0.85rem;
  color: #ccc;
  margin-top: 1.5rem;
}
</style>
