# AdSense account setup for this site

The site code uses publisher `pub-8735897520472794` and Display ad slot `3425545545`. On desktop quiz screens, the ad sits below the Amazon products. On mobile quiz screens, it sits below the quiz, above the footer. The result page places it below Amazon.

1. Deploy the site so `/ads.txt` serves `google.com, pub-8735897520472794, DIRECT, f08c47fec0942fa0`. In AdSense **Sites**, choose **Ads.txt snippet**, check **I've published the ads.txt file**, click **Verify**, and then **Request review**. Ads require a **Ready** site status.
2. Complete any outstanding AdSense account activation tasks, including payment information, in the AdSense account.
3. In **Ads**, keep **Auto ads** off for this site. The site uses only the manual Display ad unit.
4. In **Privacy & messaging → European regulations**, create and publish a message for this site with **Do not consent**, **Manage options**, and **Consent**. Use the direct introduction: “This site uses cookies for ads and analytics. Choose how your data is used.” Turn off consent-message optimization so the three-button message is presented consistently.
5. In the European regulations settings, enable consent mode for **advertising purposes** and **analytics purposes**. AdSense maps TCF Purpose 1 to analytics storage; the site reads that signal before loading Google Analytics. Both settings were enabled and saved on September 16, 2026.
6. Test the message in the EEA, UK, and Switzerland and its revocation link. Test the site's single **Ads and analytics cookies** banner elsewhere. AdSense approval and live ad inventory determine whether a filled ad appears.

The code does not submit ad requests or load Google Analytics before the appropriate stored choice is available. The AdSense script itself loads in European regions so Google's consent message can appear.
The production ad card and label appear only when AdSense reports a filled unit. Units reported as unfilled or optimized without an ad collapse. A brief reserved area can still be present while an ad request is pending because AdSense requires a visible unit to make the request.
