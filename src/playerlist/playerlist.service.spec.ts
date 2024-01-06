import { Test, TestingModule } from "@nestjs/testing";
import { PlayerlistService } from "./playerlist.service";

describe("PlayerlistService", () => {
  let service: PlayerlistService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlayerlistService],
    }).compile();

    service = module.get<PlayerlistService>(PlayerlistService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
