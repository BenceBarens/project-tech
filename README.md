<h2>Hey, en welkom bij Viamigo</h2>
<p>Leuk dat jij onze website wil bezoeken!</p>

<p>
Wij zijn Viamigo, een nieuwe manier van reizen plannen. Bij ons plan je een reis in je eentje en ga je op vakantie met geïnteresseerden die samen met jou het avontuur willen aangaan. Wij stellen gebruikers in staat hun ideale reis samen te stellen en zich aan te melden voor andere reizen, om zo samen de wereld te ontdekken.
</p>

<p>
Op de website is het mogelijk om een reis te plannen. Tijdens het plannen geef je verschillende specificaties van de reis op, zoals land, budget, datum en activiteiten. Zodra de reis is aangemaakt, kunnen andere mensen zich inschrijven.
</p>

<p>
Om met een reis gematcht te worden, moet de gebruiker een account hebben. Het maken van een account bestaat uit standaardgegevens zoals naam, leeftijd en e-mail, maar ook uit vragen die je matchresultaten later kunnen beïnvloeden. Denk hierbij aan hoe avontuurlijk je bent, hoeveel interesse je hebt in cultuur en of je prikkelgevoelig bent of juist niet. Mensen met vergelijkbare scores worden eerder met elkaar gematcht.
</p>

<p>
Daarnaast biedt onze app de mogelijkheid om te filteren. Denk bijvoorbeeld aan de prijs van de reis, het land van bestemming en het aantal reizigers.
</p>

<p>
De gebruiker kan ervoor kiezen om een gematchte reis te accepteren of af te keuren. Afgekeurde reizen worden niet meer getoond. Geaccepteerde reizen worden opgeslagen in een favorietenlijst. In deze lijst kan de gebruiker de reizen opnieuw bekijken en met elkaar vergelijken. Als de gebruiker tevreden is, kan hij of zij zich inschrijven voor de reis. De maker van de reis heeft vervolgens de mogelijkheid om deelnemers te accepteren of te weigeren.
</p>

<p>
Door middel van het swipen van een reis bepaal je of een reis geschikt voor jou is. Zo bepaal jij zelf met welke reizen je wil matchen.
</p>

<hr>

<h3>Website lokaal draaien</h3>
<p>
Wil jij onze website lokaal draaien? Dat is ook mogelijk. Met deze handleiding leggen wij je stap voor stap uit hoe je dit voor elkaar krijgt, ook als je hier nog geen ervaring mee hebt.
</p>

<p>
Voordat we beginnen, is het belangrijk dat je een codeprogramma op je laptop hebt staan. Wij raden hiervoor Visual Studio Code (VSC) aan.
</p>

<h4>Stap 1: Repository klonen</h4>
<p>
Download de repository van de website 
(<a href="https://github.com/BenceBarens/project-tech.git" target="_blank">GitHub link</a>) 
naar je computer. Dit doe je door in VSC de terminal te openen via <strong>Terminal → New Terminal</strong>.
</p>

<p>Voer vervolgens het volgende commando in:</p>
<pre><code>git clone &lt;url van de website&gt;</code></pre>

<p>
Druk op enter. VSC zorgt er nu voor dat de website lokaal op jouw computer wordt gezet. Zorg ervoor dat je weet waar de map wordt opgeslagen.
</p>

<h4>Stap 2: Packages installeren</h4>
<p>
De website maakt gebruik van externe packages die je eerst moet installeren.
</p>

<p>Voer in de terminal het volgende commando uit (zorg dat je in de projectmap zit):</p>
<pre><code>npm install</code></pre>

<p>of</p>
<pre><code>npm i</code></pre>

<p>
VSC downloadt nu alle benodigde packages. Dit kan even duren. Er verschijnt ook een map genaamd <code>node_modules</code>. Dit is normaal en nodig om de website te laten werken.
</p>

<h4>Stap 3: .env bestand instellen</h4>
<p>
De website maakt gebruik van een <code>.env</code> bestand. Hierin staan gevoelige gegevens zoals wachtwoorden, API-instellingen en databasegegevens.
</p>

<p>
Dit bestand wordt <strong>niet</strong> meegeleverd in de repository in verband met de veiligheid.
</p>

<p>
Wil je dit bestand gebruiken? Vraag het dan aan bij de projectbeheerder.
</p>

<p>
Zodra je het bestand hebt ontvangen:
</p>
<ul>
<li>Plaats het in de root van het project (naast <code>package.json</code>)</li>
<li>Zorg dat het niet in een map staat, maar los in de hoofdmap</li>
</ul>

<p>Zonder dit bestand zal de website niet werken.</p>

<h4>Stap 4: MongoDB (database)</h4>
<p>
De website maakt gebruik van een MongoDB database. Hierin wordt data opgeslagen van reizen en gebruikers.
</p>

<p>
De verbinding met de database wordt automatisch gelegd via het <code>.env</code> bestand. In de meeste gevallen hoef je hier niets voor te doen.
</p>

<h4>Stap 5: Begrijpen van de projectstructuur</h4>
<p>
Voordat je de website draait, is het handig om te weten waar alles staat:
</p>

<ul>
<li><strong>views/</strong><br>
Bevat EJS-bestanden (HTML-templates). Dit zijn de pagina’s van de website.</li>

<li><strong>sec/styles/</strong><br>
Bevat alle CSS-bestanden voor de styling van de website.</li>

<li><strong>router/</strong><br>
Bevat JavaScript-bestanden met de logica en routing van de website.</li>
</ul>

<h4>Stap 6: Website starten</h4>
<p>
Om de website lokaal te draaien, gebruik je het volgende commando in de terminal:
</p>

<pre><code>npm run dev</code></pre>

<p>
Dit zorgt ervoor dat de server wordt gestart en de website lokaal draait.
</p>

<p>Meestal verschijnt er in de terminal een melding zoals:</p>
<pre><code>Server running on http://localhost:3000</code></pre>

<h4>Stap 7: Website bekijken</h4>
<p>
Open je browser en ga naar:
</p>

<pre><code>http://localhost:3000</code></pre>

<p>
Als alles goed is gegaan, draait de website nu lokaal op jouw computer. Je kunt nu zelf aanpassingen maken en verder ontwikkelen.
</p>

<p><strong>Succes! </strong></p>
