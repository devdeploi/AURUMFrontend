export const APIURL = window.location.hostname === "localhost" ? "http://localhost:8000/api" : "https://backendaurum.safprotech.com/api";

export const BASEURL = window.location.hostname === "localhost" ? "http://localhost:8000" : "https://backendaurum.safprotech.com";


// export const APIURL = "https://backendaurum.safprotech.com/api";
// export const BASEURL = "https://backendaurum.safprotech.com";

export const onError = (error) => {
    error.target.src = "images/AURUM.png"
}
