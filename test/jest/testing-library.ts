import { configure } from "@testing-library/react";

configure({
  defaultIgnore: "script, style, [data-test-hide], [data-test-hide-content] *",
});
