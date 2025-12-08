import { obj } from "../models/types";
import { plugin } from "../plugin";

type query = Record<string, string>;

type headers = query;

interface res<T> {
  data: T;
  ok: boolean;
  details: string;
}

interface client_config extends obj {
  token: string;
  usr: string;
  pass: string;
  url: string;
}

export class client extends plugin<client_config> {
  constructor() {
    super(
      {
        token: "",
        usr: "",
        pass: "",
        url: "localhost",
      },
      {
        token: "str",
        usr: "str",
        pass: "str",
        url: "str",
      },
    );
  }

  async get<T>(route: string, q?: query): Promise<res<T>> {
    return this.w<T>(
      fetch(this.u(route, q), {
        method: "GET",
        headers: this.h(false),
      }),
    );
  }

  async post<T>(body: Partial<T>, route: string, q?: query): Promise<res<T>> {
    return this.w<T>(
      fetch(this.u(route, q), {
        method: "POST",
        headers: this.h(true),
        body: JSON.stringify(body),
      }),
    );
  }

  async put<T>(body: Partial<T>, route: string, q?: query): Promise<res<T>> {
    return this.w<T>(
      fetch(this.u(route, q), {
        method: "PUT",
        headers: this.h(true),
        body: JSON.stringify(body),
      }),
    );
  }

  async delete(route: string, q?: query): Promise<res<any>> {
    return this.w<any>(
      fetch(this.u(route, q), {
        method: "DELETE",
        headers: this.h(false),
      }),
    );
  }

  q(q: query): string {
    return (
      "?" +
      Object.entries(q)
        .map(([k, v]) => {
          return k + "=" + v;
        })
        .join("&")
    );
  }

  u(route: string, q?: query): string {
    let url: string = `${this.get_val("url")}${route}`;
    if (q) url += this.q(q);
    return url;
  }

  h(json: boolean): headers {
    let result: headers = { Accept: "application/json" };
    let token = this.get_val("token");
    let usr = this.get_val("usr");
    let pass = this.get_val("pass");
    if (json) result["Content-Type"] = "application/json";
    if (token.length) {
      result["Authorization"] = `Bearer ${token}`;
    } else if (usr.length > 0 && pass.length > 0) {
      result["Authorization"] = `Basic ${btoa(usr + ":" + pass)}`;
    }
    return result;
  }

  w<T>(request: Promise<Response>): Promise<res<T>> {
    return new Promise<res<T>>((res, _) => {
      request
        .then(async (response) => {
          if (!response.ok) {
            res({
              data: {} as any,
              ok: false,
              details: await response.text(),
            });
            return;
          }
          try {
            res({
              ok: true,
              data: await response.json(),
              details: "",
            });
          } catch (e) {
            res({
              ok: false,
              data: {} as any,
              details: `${e}`,
            });
          }
        })
        .catch((err) => {
          res({
            ok: false,
            data: {} as any,
            details: `${err}`,
          });
        });
    });
  }
}
