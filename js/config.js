/* ==========================================
   Neeraj VFX CMS Configuration
   Version : 1.0
========================================== */

const CMS_CONFIG = {

    version: "1.0",

    developerMode: true,

    paths: {

        projects: "data/projects.json",

        schema: "data/projects.schema.json"

    },

    storage: {

        provider: "local"

    },

    uploads: {

        provider: "local"

    },

    video: {

        defaultType: "single-mp4",

        defaultQuality: "Auto"

    },

    player: {

        autoplay: false,

        rememberVolume: true,

        rememberQuality: true,

        rememberPlaybackSpeed: true

    }

};