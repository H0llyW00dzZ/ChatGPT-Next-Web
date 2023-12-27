import { ModalConfigValidator, ModelConfig } from "../store";

import Locale from "../locales";
import { InputRange } from "./input-range";
import { ListItem, Select } from "./ui-lib";
import { useAllModels } from "../utils/hooks";
import {
  DEFAULT_SYSTEM_TEMPLATE,
  ModelProvider,
} from "../constant";

export function ModelConfigList(props: {
  modelConfig: ModelConfig;
  updateConfig: (updater: (config: ModelConfig) => void) => void;
}) {
  const allModels = useAllModels();

  const sizeOptions = ["256x256", "512x512", "1024x1024", "1792x1024", "1024x1792"];
  const styleOptions = ["vivid", "natural"];

  const isDalleModel = props.modelConfig.model.startsWith("dall-e");
  const customsystemprompts = [
    { value: DEFAULT_SYSTEM_TEMPLATE, label: Locale.Label_System_Template.Default },
    { value: Locale.System_Template, label: Locale.Label_System_Template.Local },
  ];

  return (
    <>
      <ListItem title={Locale.Settings.Model}>
        <Select
          value={props.modelConfig.model}
          onChange={(e) => {
            props.updateConfig(
              (config) =>
              (config.model = ModalConfigValidator.model(
                e.currentTarget.value,
              )),
            );
          }}
        >
          {allModels
            .filter((v) => v.available)
            .map((v, i) => (
              <option value={v.name} key={i}>
                {v.displayName}({v.provider?.providerName})
              </option>
            ))}
        </Select>
      </ListItem>
      {isDalleModel && (
        <>
          <ListItem
            title={Locale.Settings.NumberOfImages.Title}
            subTitle={Locale.Settings.NumberOfImages.SubTitle}
          >
            <InputRange
              value={props.modelConfig.n?.toFixed(1)}
              min="1"
              max="10"
              step="1"
              onChange={(e) => {
                props.updateConfig((config) => {
                  config.n = ModalConfigValidator.n(e.currentTarget.valueAsNumber);
                });
              }}
            ></InputRange>
          </ListItem>
          <ListItem
            title={Locale.Settings.QualityOfImages.Title}
            subTitle={Locale.Settings.QualityOfImages.SubTitle}
          >
            <Select
              value={props.modelConfig.quality}
              onChange={(e) =>
                props.updateConfig(
                  (config) => (config.quality = ModalConfigValidator.quality(e.currentTarget.value))
                )
              }
            >
              <option value="hd">HD</option>
            </Select>
          </ListItem>
          <ListItem
            title={Locale.Settings.SizeOfImages.Title}
            subTitle={Locale.Settings.SizeOfImages.SubTitle}
          >
            <Select
              value={props.modelConfig.size}
              onChange={(e) =>
                props.updateConfig(
                  (config) => (config.size = ModalConfigValidator.size(e.currentTarget.value))
                )
              }
            >
              {sizeOptions.map((size) => (
                <option value={size} key={size}>
                  {size}
                </option>
              ))}
            </Select>
          </ListItem>
          <ListItem
            title={Locale.Settings.StyleOfImages.Title}
            subTitle={Locale.Settings.StyleOfImages.SubTitle}
          >
            <Select
              value={props.modelConfig.style}
              onChange={(e) =>
                props.updateConfig(
                  (config) => (config.style = ModalConfigValidator.style(e.currentTarget.value))
                )
              }
            >
              {styleOptions.map((style) => (
                <option value={style} key={style}>
                  {style}
                </option>
              ))}
            </Select>
          </ListItem>
        </>
      )}

      {!isDalleModel && (
        <>
          <ListItem
            title={Locale.Settings.UseMaxTokens.Title}
            subTitle={Locale.Settings.UseMaxTokens.SubTitle}
          >
            <input
              type="checkbox"
              checked={props.modelConfig.useMaxTokens}
              onChange={(e) =>
                props.updateConfig(
                  (config) => (config.useMaxTokens = e.currentTarget.checked)
                )
              }
            ></input>
          </ListItem>
          {props.modelConfig.useMaxTokens && (
            <>
              <ListItem
                title={Locale.Settings.MaxTokens.Title}
                subTitle={Locale.Settings.MaxTokens.SubTitle}
              >
                <input
                  type="number"
                  min={1024}
                  max={512000}
                  value={props.modelConfig.max_tokens}
                  onChange={(e) =>
                    props.updateConfig(
                      (config) =>
                      (config.max_tokens = ModalConfigValidator.max_tokens(
                        e.currentTarget.valueAsNumber
                      ))
                    )
                  }
                ></input>
              </ListItem>
            </>
          )}
          <ListItem
            title={Locale.Settings.Temperature.Title}
            subTitle={Locale.Settings.Temperature.SubTitle}
          >
            <InputRange
              value={props.modelConfig.temperature?.toFixed(1)}
              min="0"
              max="1" // lets limit it to 0-1
              step="0.1"
              onChange={(e) => {
                props.updateConfig(
                  (config) =>
                  (config.temperature = ModalConfigValidator.temperature(
                    e.currentTarget.valueAsNumber,
                  )),
                );
              }}
            ></InputRange>
          </ListItem>
          <ListItem
            title={Locale.Settings.TopP.Title}
            subTitle={Locale.Settings.TopP.SubTitle}
          >
            <InputRange
              value={(props.modelConfig.top_p ?? 1).toFixed(1)}
              min="0"
              max="1"
              step="0.1"
              onChange={(e) => {
                props.updateConfig(
                  (config) =>
                  (config.top_p = ModalConfigValidator.top_p(
                    e.currentTarget.valueAsNumber,
                  )),
                );
              }}
            ></InputRange>
          </ListItem>

          {allModels && (
            <>
              <ListItem
                title={Locale.Settings.InjectSystemPrompts.Title}
                subTitle={Locale.Settings.InjectSystemPrompts.SubTitle}
              >
                <input
                  type="checkbox"
                  checked={props.modelConfig.enableInjectSystemPrompts}
                  onChange={(e) =>
                    props.updateConfig((config) => {
                      // Use e.target to refer to the element that triggered the event
                      config.enableInjectSystemPrompts = e.target.checked;
                    })
                  }
                />
              </ListItem>

              {props.modelConfig.enableInjectSystemPrompts && (
                <ListItem
                  title={Locale.Settings.SystemPromptTemplate.Title}
                  subTitle={Locale.Settings.SystemPromptTemplate.SubTitle}
                >
                  <Select
                    value={props.modelConfig.systemprompt.default}
                    onChange={(e) =>
                      props.updateConfig((config) => {
                        // Use e.target to refer to the element that triggered the event
                        config.systemprompt.default = e.target.value;
                      })
                    }
                  >
                    {customsystemprompts.map((prompt) => (
                      // Use a unique value for the key, not the array index
                      <option value={prompt.value} key={prompt.value}>
                        {prompt.label}
                      </option>
                    ))}
                  </Select>
                </ListItem>
              )}
              <ListItem
                title={Locale.Settings.InputTemplate.Title}
                subTitle={Locale.Settings.InputTemplate.SubTitle}
              >
                <input
                  type="text"
                  value={props.modelConfig.template}
                  onChange={(e) =>
                    props.updateConfig(
                      (config) => (config.template = e.currentTarget.value),
                    )
                  }
                ></input>
              </ListItem>
            </>
          )}
          <ListItem
            title={Locale.Settings.HistoryCount.Title}
            subTitle={Locale.Settings.HistoryCount.SubTitle}
          >
            <InputRange
              title={props.modelConfig.historyMessageCount.toString()}
              value={props.modelConfig.historyMessageCount}
              min="0"
              max="64"
              step="1"
              onChange={(e) =>
                props.updateConfig(
                  (config) => (config.historyMessageCount = e.target.valueAsNumber),
                )
              }
            ></InputRange>
          </ListItem>

          <ListItem
            title={Locale.Settings.CompressThreshold.Title}
            subTitle={Locale.Settings.CompressThreshold.SubTitle}
          >
            <input
              type="number"
              min={500}
              max={4000}
              value={props.modelConfig.compressMessageLengthThreshold}
              onChange={(e) =>
                props.updateConfig(
                  (config) =>
                  (config.compressMessageLengthThreshold =
                    e.currentTarget.valueAsNumber),
                )
              }
            ></input>
          </ListItem>
          <ListItem title={Locale.Memory.Title} subTitle={Locale.Memory.Send}>
            <input
              type="checkbox"
              checked={props.modelConfig.sendMemory}
              onChange={(e) =>
                props.updateConfig(
                  (config) => (config.sendMemory = e.currentTarget.checked),
                )
              }
            ></input>
          </ListItem>
        </>
      )}
    </>
  );
}
