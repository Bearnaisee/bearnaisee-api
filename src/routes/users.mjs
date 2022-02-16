export default (server) => {
  server.get("/user/login", async (req, res) => {
    res.status(200).send({
      msg: "/user/login",
    });
  });

  server.get("/user/signup", async (req, res) => {
    res.status(200).send({
      msg: "/user/signup",
    });
  });
};
