<template>
  <header class="drexel-header">
    <!-- Accessibility Alert -->


    <!-- Skip Link -->
    <a href="#main-content" class="skip-link">Skip to main content</a>

    <!-- Branding Row -->
    <div class="branding">
      <!-- <a href="/" aria-label="Home" class="logo-link">
        <img
          src="https://www.epa.gov/sites/all/themes/epa/logo.png"
          alt="EPA Logo"
          class="site-logo"
        />
      </a> -->
      <div class="site-info">
        <h1 class="site-title">
          <a href="https://www.epa.gov/" target="_blank" rel="noopener noreferrer">
            US EPA
          </a>
        </h1>
        <p class="site-slogan">United States Agency</p>
      </div>

      <!-- Search -->
      <form
        action="https://search.epa.gov/epasearch/epasearch"
        class="search-form"
        method="get"
        role="search"
      >
        <input
          type="search"
          name="querytext"
          id="search-box"
          class="search-input"
          placeholder="Search"
        />
        <button type="submit" class="search-button">Search</button>

        <!-- Hidden search fields -->
        <input type="hidden" name="typeofsearch" value="epa" />
        <input type="hidden" name="result_template" value="2col.ftl" />
      </form>
    </div>

    <!-- Navigation -->
    <nav class="main-nav" aria-label="Main navigation">
      <ul>
        <li>
          <a href="https://www.epa.gov/environmental-topics" target="_blank">Environmental Topics</a>
        </li>
        <li>
          <a href="https://www.epa.gov/laws-regulations" target="_blank">Laws & Regulations</a>
        </li>
        <li>
          <a href="https://www.epa.gov/aboutepa" target="_blank">About RMP</a>
        </li>
      </ul>
    </nav>
  </header>
</template>

<script>
export default {
  name: 'Header',
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap');

.drexel-header {
  font-family: 'Open Sans', sans-serif;
  background-color: #002663;
  color: white;
  padding: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.alert-banner {
  background-color: #f2f2f2;
  color: #000;
  font-size: 0.9rem;
  text-align: center;
}

.skip-link {
  position: absolute;
  left: -9999px;
}

.skip-link:focus {
  position: absolute;
  left: 1rem;
  top: 1rem;
  background: #ffe600;
  padding: 0.5rem;
  z-index: 1000;
  color: black;
  font-weight: bold;
  text-decoration: none;
}

.branding {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.2rem 2rem;
  flex-wrap: wrap;
}

.logo-link {
  display: flex;
  align-items: center;
}

.site-logo {
  height: 60px;
  margin-right: 1rem;
}

.site-info {
  flex-grow: 1;
}

.site-title a {
  font-size: 1.6rem;
  font-weight: 700;
  color: #ffe600;
  text-decoration: none;
}

.site-slogan {
  font-size: 0.9rem;
  color: #ccc;
}

.search-form {
  display: flex;
  margin-top: 1rem;
  width: 100%;
  max-width: 350px;
}

.search-input {
  flex: 1;
  padding: 0.5rem;
  font-size: 1rem;
  border: none;
  border-radius: 4px 0 0 4px;
}

.search-button {
  background-color: #ffe600;
  color: #002663;
  border: none;
  padding: 0.5rem 1rem;
  font-weight: 600;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
}

.main-nav {
  background-color: #001e44;
  padding: 0.75rem 0;
  text-align: center;
}

.main-nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.main-nav a {
  color: white;
  text-decoration: none;
  font-weight: 600;
  font-size: 1rem;
}

.main-nav a:hover {
  text-decoration: underline;
}
</style>
