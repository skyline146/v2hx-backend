import { Test, TestingModule } from "@nestjs/testing";
import { PlayerlistController } from "./playerlist.controller";

describe("PlayerlistController", () => {
  let controller: PlayerlistController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlayerlistController],
    }).compile();

    controller = module.get<PlayerlistController>(PlayerlistController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
