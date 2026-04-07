document.getElementById("togglePassword").addEventListener("click", wachtwoordTonen)

function wachtwoordTonen() {
  const wachtwoordVeld = document.getElementById("wachtwoord")
  const eyeOpen = document.getElementById("eye-open")
  const eyeClosed = document.getElementById("eye-closed")

  if (wachtwoordVeld.type === "password") {
    wachtwoordVeld.type = "text"
    eyeOpen.classList.add("hidden")
    eyeClosed.classList.remove("hidden")
  } else {
    wachtwoordVeld.type = "password"
    eyeOpen.classList.remove("hidden")
    eyeClosed.classList.add("hidden")
  }
}