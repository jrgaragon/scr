var app = new Vue({
  el: "#app-main-gallery",
  data: {
    galleries: [],
    alerts: {
      success: {
        message: "",
        show: false,
      },
      error: {
        message: "",
        show: false,
      },
    },
  },
  mounted() {
    let uri = window.location.search.substring(1);
    let params = new URLSearchParams(uri);
    console.log(params.get("id"));

    axios
      .get(
        `http://localhost:3000/petite/subgalleries/${params.get("id").trim()}`
      )
      .then(response => {
        this.galleries = response.data;
      })
      .catch(e => console.log(e));
  },
  methods: {
    deleteGallery: function (galleryId) {
      let vm = this;

      if (confirm('Delete?')) {
        axios
          .delete(
            `http://localhost:3000/petite/admin/deleteSubGallery/${galleryId}`
          )
          .then(response => vm.processResponseMesage(response))
          .catch(e => vm.processResponseMesage(e));
      }
    },
    processResponseMesage: function (response) {
      let vm = this;
      if (response.data.status === "done") {
        console.log(response);
        vm.alerts.success.show = true;
        vm.alerts.success.message = `${response.data.message}`;
        setTimeout(() => {
          vm.alerts.success.show = false;
          vm.alerts.success.message = "";
        }, 5000);
      } else {
        if (response.data.message) {
          vm.alerts.error.show = true;
          vm.alerts.error.message = `${response.data.message}`;
          setTimeout(() => {
            vm.alerts.error.show = false;
            vm.alerts.error.message = "";
          }, 10000);
        } else {
          console.log(response);
        }
      }
    },
  },
});